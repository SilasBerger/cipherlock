from machine import Pin, SPI
import uasyncio as asyncio
from time import sleep_ms

# -------------------------------
# Constants
# -------------------------------
PA_OUTPUT_PA_BOOST_PIN = 1

REG_FIFO = 0x00
REG_OP_MODE = 0x01
REG_FRF_MSB = 0x06
REG_FRF_MID = 0x07
REG_FRF_LSB = 0x08
REG_PA_CONFIG = 0x09
REG_LNA = 0x0c
REG_FIFO_ADDR_PTR = 0x0d
REG_FIFO_TX_BASE_ADDR = 0x0e
REG_FIFO_RX_BASE_ADDR = 0x0f
REG_FIFO_RX_CURRENT_ADDR = 0x10
REG_IRQ_FLAGS = 0x12
REG_RX_NB_BYTES = 0x13
REG_PKT_RSSI_VALUE = 0x1a
REG_PKT_SNR_VALUE = 0x1b
REG_MODEM_CONFIG_1 = 0x1d
REG_MODEM_CONFIG_2 = 0x1e
REG_PREAMBLE_MSB = 0x20
REG_PREAMBLE_LSB = 0x21
REG_PAYLOAD_LENGTH = 0x22
REG_MODEM_CONFIG_3 = 0x26
REG_DETECTION_OPTIMIZE = 0x31
REG_DETECTION_THRESHOLD = 0x37
REG_SYNC_WORD = 0x39
REG_VERSION = 0x42
REG_DIO_MAPPING_1 = 0x40

MODE_LONG_RANGE_MODE = 0x80
MODE_SLEEP = 0x00
MODE_STDBY = 0x01
MODE_TX = 0x03
MODE_RX_CONTINUOUS = 0x05

PA_BOOST = 0x80

IRQ_TX_DONE_MASK = 0x08
IRQ_RX_DONE_MASK = 0x40

MAX_PKT_LENGTH = 255

# -------------------------------
# Driver
# -------------------------------
class SX127x:
    default_parameters = {
        'frequency': 868000000,
        'tx_power_level': 15,
        'signal_bandwidth': 125000,
        'spreading_factor': 8,
        'coding_rate': 5,
        'preamble_length': 8,
        'implicit_header': False,
        'sync_word': 0x12,
        'enable_CRC': False,
    }

    def __init__(self, spi, pins, parameters=None):
        if parameters is None:
            parameters = self.default_parameters
        self._spi = spi
        self._pins = pins
        self._params = parameters

        # Pins
        self._pin_ss = Pin(pins["ss"], Pin.OUT)
        self._pin_reset = Pin(pins["reset"], Pin.OUT)
        if "led" in pins:
            self._led_status = Pin(pins["led"], Pin.OUT)

        # Reset radio
        self.reset_radio()

        # Check chip version
        version = self.read_register(REG_VERSION)
        if version != 0x12:
            raise Exception(f"Invalid SX127x version: {version}")

        # Configure radio
        self.sleep()
        self.set_frequency(parameters["frequency"])
        self.set_tx_power(parameters["tx_power_level"])
        self.set_sync_word(parameters["sync_word"])

        # Base addresses
        self.write_register(REG_FIFO_TX_BASE_ADDR, 0x00)
        self.write_register(REG_FIFO_RX_BASE_ADDR, 0x00)

        # Start continuous RX
        self.receive()

    # -------------------------------
    # Hardware reset
    # -------------------------------
    def reset_radio(self):
        self._pin_reset.value(0)
        sleep_ms(10)
        self._pin_reset.value(1)
        sleep_ms(10)

    # -------------------------------
    # TX
    # -------------------------------
    async def send(self, data):
        if isinstance(data, str):
            data = data.encode()

        self.standby()
        self.write_register(REG_FIFO_ADDR_PTR, 0x00)
        self.write_register(REG_PAYLOAD_LENGTH, len(data))

        for b in data:
            self.write_register(REG_FIFO, b)

        # DIO0 → TX_DONE
        self.write_register(REG_DIO_MAPPING_1, 0x40)

        self.write_register(REG_OP_MODE, MODE_LONG_RANGE_MODE | MODE_TX)

        # Wait for TX done by polling IRQ
        while True:
            irq = self.read_register(REG_IRQ_FLAGS)
            if irq & IRQ_TX_DONE_MASK:
                self.write_register(REG_IRQ_FLAGS, irq)  # clear IRQ
                break
            await asyncio.sleep_ms(1)

        # Restore RX mode
        self.write_register(REG_DIO_MAPPING_1, 0x00)
        self.receive()

    # -------------------------------
    # RX
    # -------------------------------
    async def recv(self):
        # Wait for RX_DONE by polling IRQ flags
        while True:
            irq = self.read_register(REG_IRQ_FLAGS)
            if irq & IRQ_RX_DONE_MASK:
                self.write_register(REG_IRQ_FLAGS, irq)  # clear IRQ

                # Read payload
                self.write_register(REG_FIFO_ADDR_PTR,
                                    self.read_register(REG_FIFO_RX_CURRENT_ADDR))
                length = self.read_register(REG_RX_NB_BYTES)
                payload = bytearray()
                for _ in range(length):
                    payload.append(self.read_register(REG_FIFO))

                # Re-enter continuous RX
                self.receive()
                return bytes(payload)

            await asyncio.sleep_ms(1)

    # -------------------------------
    # Radio Modes
    # -------------------------------
    def receive(self):
        self.write_register(REG_DIO_MAPPING_1, 0x00)
        self.write_register(REG_OP_MODE, MODE_LONG_RANGE_MODE | MODE_RX_CONTINUOUS)

    def standby(self):
        self.write_register(REG_OP_MODE, MODE_LONG_RANGE_MODE | MODE_STDBY)

    def sleep(self):
        self.write_register(REG_OP_MODE, MODE_LONG_RANGE_MODE | MODE_SLEEP)

    # -------------------------------
    # Config
    # -------------------------------
    def set_frequency(self, frequency):
        self._frequency = int(frequency)
        frf = int((self._frequency << 19) / 32_000_000)
        self.write_register(REG_FRF_MSB, (frf >> 16) & 0xFF)
        self.write_register(REG_FRF_MID, (frf >> 8) & 0xFF)
        self.write_register(REG_FRF_LSB, frf & 0xFF)

    def set_tx_power(self, level):
        level = min(max(level, 2), 17)
        self.write_register(REG_PA_CONFIG, PA_BOOST | (level - 2))

    def set_sync_word(self, sw):
        self.write_register(REG_SYNC_WORD, sw)

    # -------------------------------
    # SPI helpers
    # -------------------------------
    def read_register(self, addr):
        self._pin_ss.value(0)
        self._spi.write(bytearray([addr & 0x7F]))
        val = self._spi.read(1)[0]
        self._pin_ss.value(1)
        return val

    def write_register(self, addr, value):
        self._pin_ss.value(0)
        self._spi.write(bytearray([addr | 0x80, value]))
        self._pin_ss.value(1)

    # -------------------------------
    # LED helper
    # -------------------------------
    def blink_led(self, times=1, on_ms=100, off_ms=100):
        if hasattr(self, "_led_status"):
            for _ in range(times):
                self._led_status.value(1)
                sleep_ms(on_ms)
                self._led_status.value(0)
                sleep_ms(off_ms)