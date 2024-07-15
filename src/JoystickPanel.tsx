import ReactDOM from "react-dom";
import { PanelExtensionContext, SettingsTreeAction, Topic, MessageEvent } from "@foxglove/extension";
import { fromDate } from "@foxglove/rostime";
import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { buildSettingsTree, settingsActionReducer } from "./panelSettings";
import { AckermannDriveStamped, JoyStickConfig, JoyStickPos } from "./types";
import { JoyToAckermann } from "./Ackermann";

export function minmax(value: number, limit: number): number {
    return Math.max(Math.min(value, limit), -limit);
}

export const JOYSTICKBOUNDS: number = 50;

function JoystickPanel({ context }: { context: PanelExtensionContext }): JSX.Element {
    const [topics, setTopics] = useState<readonly Topic[] | undefined>();
    const [, setMessages] = useState<readonly MessageEvent[] | undefined>();

    const [pubTopic, setPubTopic] = useState<string | undefined>();

    const [joystickPos, setJoystickPos] = useState<JoyStickPos>({ x: 0, y: 0 });

    const [config, setConfig] = useState<JoyStickConfig>(() => {
        const partialConfig = context.initialState as Partial<JoyStickConfig>;
        partialConfig.pubTopic ??= "/cmd_vel";
        partialConfig.publishFrameId ??= "";
        partialConfig.publishActive ??= true;
        partialConfig.invertSteering ??= false;

        partialConfig.maxForwardMPS ??= 1;
        partialConfig.maxBackwardMPS ??= 1;
        partialConfig.accelerationMPSS ??= 1;
        partialConfig.jerkMPSSS ??= 1;

        partialConfig.maxLeftRad ??= 1;
        partialConfig.maxRightRad ??= 1;
        partialConfig.maxSteeringAngleVelRadPS ??= 1;

        return partialConfig as JoyStickConfig;
    });

    const settingsActionHandler = useCallback(
        (action: SettingsTreeAction) => {
            setConfig((prevConfig) => settingsActionReducer(prevConfig, action));
        },
        [setConfig],
    );

    useEffect(() => {
        context.updatePanelSettingsEditor({
            actionHandler: settingsActionHandler,
            nodes: buildSettingsTree(config, topics as Topic[]),
        });
    }, [config, context, settingsActionHandler, topics]);

    useEffect(() => {
        const joystickHeadElement = document.getElementById("joystick-head") as HTMLElement;
        let mouseStartX = 0;
        let mouseStartY = 0;
        let isMouseDown = false;

        const handleMouseDown = (event: DocumentEventMap["mouseup"]) => {
            isMouseDown = true;
            mouseStartX = event.clientX;
            mouseStartY = event.clientY;
            joystickHeadElement.style.cssText = `
                animation: none;
                cursor: grabbing;
              `;
        };

        const handleMouseUp = () => {
            isMouseDown = false;

            setJoystickPos({ x: 0, y: 0 });

            joystickHeadElement.style.cssText = `
                left: 0px;
                top: 0px;
                animation: none;
                cursor: grabbing;
              `;
        };

        const handleMouseMove = (event: DocumentEventMap["mousemove"]) => {
            if (isMouseDown) {
                const mouseDeltaX = -minmax(mouseStartX - event.clientX, JOYSTICKBOUNDS);
                const mouseDeltaY = -minmax(mouseStartY - event.clientY, JOYSTICKBOUNDS);

                setJoystickPos({ x: mouseDeltaX, y: mouseDeltaY });

                joystickHeadElement.style.cssText = `
                  left: ${mouseDeltaX}px;
                  top: ${mouseDeltaY}px;
                  animation: none;
                  cursor: grabbing;
                `;
            }
        };

        joystickHeadElement.addEventListener("mousedown", handleMouseDown);
        document.addEventListener("mouseup", handleMouseUp, true);
        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            joystickHeadElement.removeEventListener("mousedown", handleMouseDown);
            document.removeEventListener("mouseup", handleMouseUp, true);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    useLayoutEffect(() => {
        context.onRender = (renderState, _) => {
            setTopics(renderState.topics);
            setMessages(renderState.currentFrame);
        };

        context.watch("topics");
        context.watch("currentFrame");
    }, [context]);
    config.pubTopic;

    useEffect(() => {
        if (config.publishActive) {
            setPubTopic((oldTopic) => {
                if (config.publishActive) {
                    if (oldTopic) {
                        context.unadvertise?.(oldTopic);
                    }
                    context.advertise?.(config.pubTopic, "ackermann_msgs/msg/AckermannDriveStamped");
                    return config.pubTopic;
                } else {
                    if (oldTopic) {
                        context.unadvertise?.(oldTopic);
                    }
                    return "";
                }
            });
        }
    }, [config.pubTopic, config.publishActive, context]);

    useEffect(() => {
        if (!config.publishActive ||
            !pubTopic ||
            !(pubTopic === config.pubTopic)) {
            return;
        }

        let msg: AckermannDriveStamped = {
            header: {
                stamp: fromDate(new Date()),
                frame_id: config.publishFrameId,
            },
            drive: JoyToAckermann(joystickPos, config),
        };

        context.publish?.(
            config.pubTopic,
            msg,
        );
    }, [joystickPos]);

    return (
        <div className="wrapper">
            <div id="joystick-wrapper">
                <div id="joystick">
                    <div className="joystick-arrow"></div>
                    <div className="joystick-arrow"></div>
                    <div className="joystick-arrow"></div>
                    <div className="joystick-arrow"></div>
                    <div id="joystick-head"></div>
                </div>
            </div>
            <style>{`
          /* https://coolors.co/f06449-ede6e3-7d82b8-36382e-613f75  */
          :root {
              --background-color: #ede6e3;
              --wall-color: #36382e;
              --joystick-color: #210124;
              --joystick-head-color: #f06449;
              --ball-color: #f06449;
              --end-color: #7d82b8;
              --text-color: #210124;
          }

          body {
              font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
              background-color: var(--background-color);
          }

          .wrapper {
              width: 100%;
              height: auto;
              max-width: 100vh;
              aspect-ratio: 1;
              margin: 0 auto;
              padding: 32px;
          }

          .joystick-arrow {
              transform: scale(3);
          }

          #joystick-wrapper {
              width: 100%;
              height: 100%;
              margin: 0 auto;
              display: flex;
              align-items: center;
              justify-content: center;
          }

          #joystick {
              position: relative;
              background-color: var(--joystick-color);
              border-radius: 50%;
              width: 50%;
              height: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              grid-row: 2;
          }

          #joystick-head {
              position: relative;
              background-color: var(--joystick-head-color);
              border-radius: 50%;
              width: 40%;
              height: 40%;
              cursor: grab;
          }

          .joystick-arrow:nth-of-type(1) {
              position: absolute;
              bottom: 115%;
              border-left: 10px solid transparent;
              border-right: 10px solid transparent;
              border-bottom: 10px solid var(--joystick-color);
          }

          .joystick-arrow:nth-of-type(2) {
              position: absolute;
              top: 115%;
              width: 0;
              height: 0;
              border-left: 10px solid transparent;
              border-right: 10px solid transparent;
              border-top: 10px solid var(--joystick-color);
          }

          .joystick-arrow:nth-of-type(3) {
              position: absolute;
              left: 115%;
              width: 0;
              height: 0;
              border-top: 10px solid transparent;
              border-bottom: 10px solid transparent;
              border-left: 10px solid var(--joystick-color);
          }

          .joystick-arrow:nth-of-type(4) {
              position: absolute;
              right: 115%;
              width: 0;
              height: 0;
              border-top: 10px solid transparent;
              border-bottom: 10px solid transparent;
              border-right: 10px solid var(--joystick-color);
          }
      `}</style>
        </div>
    );
}

export function initJoystickPanel(context: PanelExtensionContext): () => void {
    ReactDOM.render(<JoystickPanel context={context} />, context.panelElement);

    return () => {
        ReactDOM.unmountComponentAtNode(context.panelElement);
    };
}