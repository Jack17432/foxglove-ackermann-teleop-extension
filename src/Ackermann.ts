import { JoyStickConfig, AckermannDrive, JoyStickPos } from "./types";
import { JOYSTICKBOUNDS } from "./JoystickPanel";

export function JoyToAckermann(input: JoyStickPos, bounds: JoyStickConfig): AckermannDrive {
    let speed = input.y / JOYSTICKBOUNDS;
    if (speed >= 0.0) {
        speed *= bounds.maxForwardMPS;
    }
    else {
        speed *= -bounds.maxBackwardMPS;
    }

    let turn = input.x / JOYSTICKBOUNDS;
    if (!((turn > 0.0) === (bounds.invertSteering))) {  // https://stackoverflow.com/a/18064899
        turn *= bounds.maxLeftRad;
    }
    else {
        turn *= -bounds.maxRightRad;
    }

    return {
        jerk: bounds.jerkMPSSS,
        acceleration: bounds.accelerationMPSS,
        speed: speed,
        steering_angle: turn,
        steering_angle_velocity: bounds.maxSteeringAngleVelRadPS,
    };
}