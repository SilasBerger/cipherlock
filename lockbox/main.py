from servo import Servo
import time

SERVO_PIN = 22
IDLE_ANGLE = 140
UNLOCK_ANGLE = 165
UNLOCK_DURATION_S = 0.5

lock = Servo(SERVO_PIN)

lock.write(IDLE_ANGLE)


def unlock():
    lock.write(UNLOCK_ANGLE)
    time.sleep(UNLOCK_DURATION_S)
    lock.write(IDLE_ANGLE)


while True:
    cmd = input("'unlock' | <angle> (0-180°): ")
    if cmd.lower().strip() == "unlock":
        unlock()
    else:
        angle = float(cmd)
        lock.write(angle)
