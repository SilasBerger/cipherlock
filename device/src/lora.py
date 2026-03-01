from machine import Pin, SPI
from sx127x import SX127x


def init(pins_config, lora_params):
    _device_spi = SPI(baudrate=10000000,
                  polarity=0, phase=0, bits=8, firstbit=SPI.MSB,
                  sck=Pin(pins_config['sck'], Pin.OUT, Pin.PULL_DOWN),
                  mosi=Pin(pins_config['mosi'], Pin.OUT, Pin.PULL_UP),
                  miso=Pin(pins_config['miso'], Pin.IN, Pin.PULL_UP))

    return SX127x(_device_spi, pins=pins_config, parameters=lora_params)