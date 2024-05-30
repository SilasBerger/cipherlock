from machine import Pin, PWM


class Servo:

    def __init__(self, servo_pin, pwm_freq = 50, pulse_range_min_us = 500, pulse_range_max_us = 2500, angle_max = 180):
        self._pwm_freq = pwm_freq
        self._pulse_range_min = pulse_range_min_us
        self._pulse_range_max = pulse_range_max_us
        self._angle_max = angle_max
        self._servo = PWM(Pin(servo_pin), freq = pwm_freq, duty_u16 = self._angle_to_duty_cycle(0))

    def _angle_to_duty_cycle(self, angle):
        pulse_width_us = self._pulse_range_min + (angle * (self._pulse_range_max - self._pulse_range_min) * (1 / self._angle_max))
        time_period_us = 1000000 / self._pwm_freq
        duty_cycle_decimal = pulse_width_us / time_period_us
        return round(duty_cycle_decimal * (2 ** 16 - 1))

    def write(self, angle):
        self._servo.duty_u16(self._angle_to_duty_cycle(angle))
