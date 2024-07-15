import { ExtensionContext } from "@foxglove/extension";
import { initJoystickPanel } from "./JoystickPanel";

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerPanel({ name: "Ackermann Joystick", initPanel: initJoystickPanel });
}
