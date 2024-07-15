from config import *
from machine import Pin, SPI
from sx127x import SX127x

_device_spi = SPI(baudrate=10000000,
                  polarity=0, phase=0, bits=8, firstbit=SPI.MSB,
                  sck=Pin(device_config['sck'], Pin.OUT, Pin.PULL_DOWN),
                  mosi=Pin(device_config['mosi'], Pin.OUT, Pin.PULL_UP),
                  miso=Pin(device_config['miso'], Pin.IN, Pin.PULL_UP))

lora = SX127x(_device_spi, pins=device_config, parameters=lora_parameters)

