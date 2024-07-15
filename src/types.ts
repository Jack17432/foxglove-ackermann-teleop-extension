import { Time } from "@foxglove/rostime";

// https://github.com/ros-drivers/ackermann_msgs
export type Header = {
    stamp: Time;
    frame_id: string;
};

export type AckermannDrive = {
    steering_angle: number          // desired virtual angle (radians)
    steering_angle_velocity: number // desired rate of change (radians/s)

    speed: number                   // desired forward speed (m/s)
    acceleration: number            // desired acceleration (m/s^2)
    jerk: number                    // desired jerk (m/s^3)
}

export type AckermannDriveStamped = {
    header: Header;
    drive: AckermannDrive;
}

export type JoyStickConfig = {
    pubTopic: string;
    publishFrameId: string;
    publishActive: boolean;
    invertSteering: boolean;

    maxLeftRad: number;
    maxRightRad: number;
    maxSteeringAngleVelRadPS: number;

    maxForwardMPS: number;
    maxBackwardMPS: number;
    accelerationMPSS: number;
    jerkMPSSS: number;
};

export type JoyStickPos = {
    x: number;
    y: number;
}
