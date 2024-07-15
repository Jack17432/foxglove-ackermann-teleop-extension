import { SettingsTreeAction, SettingsTreeFields, SettingsTreeNodes, Topic } from "@foxglove/extension";
import { produce } from "immer";
import * as _ from "lodash-es";
import { JoyStickConfig } from "./types";

export function settingsActionReducer(prevConfig: JoyStickConfig, action: SettingsTreeAction): JoyStickConfig {
    return produce(prevConfig, (draft) => {
        if (action.action === "update") {
            const { path, value } = action.payload;
            _.set(draft, path.slice(1), value);
        }
    });
}

export function buildSettingsTree(config: JoyStickConfig, topics: Topic[]): SettingsTreeNodes {
    const topicOptions = (topics ?? [])
        .filter((topic) => topic.schemaName === "ackermann_msgs/msg/AckermannDriveStamped")
        .map((topic) => ({ value: topic.name, label: topic.name }));

    const ackermannFields: SettingsTreeFields = {
        maxLeftRad: {
            label: "Max Steering angle Left (radians)",
            input: "number",
            value: config.maxLeftRad,
        },
        maxRightRad: {
            label: "Max Steering angle Right (radians)",
            input: "number",
            value: config.maxRightRad,
        },
        maxSteeringAngleVelRadPS: {
            label: "desired steering rate of change (radians/s)",
            input: "number",
            value: config.maxSteeringAngleVelRadPS,
        },
        maxForwardMPS: {
            label: "Max forward speed (m/s)",
            input: "number",
            value: config.maxForwardMPS,
        },
        maxBackwardMPS: {
            label: "Max backwards speed (m/s)",
            input: "number",
            value: config.maxBackwardMPS,
        },
        accelerationMPSS: {
            label: "desired acceleration (m/s^2)",
            input: "number",
            value: config.accelerationMPSS,
        },
        jerkMPSSS: {
            label: "desired jerk (m/s^3)",
            input: "number",
            value: config.jerkMPSSS,
        },
        invertSteering: {
            label: "invert steering direction",
            input: "boolean",
            value: config.invertSteering,
        }
    }

    const publishFields: SettingsTreeFields = {
        pubTopic: {
            label: "Pub Topic",
            input: "select",
            options: topicOptions,
            value: config.pubTopic,
        },
        publishFrameId: {
            label: "Frame ID",
            input: "string",
            value: config.publishFrameId,
        },
        publishActive: {
            label: "Active",
            input: "boolean",
            value: config.publishActive,
        },
    };

    return {
        ackermann: {
            label: "ackermann config",
            fields: ackermannFields,
        },
        publish: {
            label: "publish",
            fields: publishFields,
        }
    };
}