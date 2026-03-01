# Cipherlock Device
## Setup
- Create a virtualenv: `python3 -v venv venv`
- Activate it: `source venv/bin/activate`
- Install requirements: `pip install -r requirements.txt`
- Make sure `cldevice.py` is executable: `chmod +x cldevice.py`

## Basic setup and development
- `./cldevice write-device-id`: Write a random device ID to the connected device.
- `./cldevice write-config config.json`: Write the default config to the connected device.
- `./cldevice dev`: Run the contents of the `src` dir on the connected device.

## CLI commands
- `./cldevice`: See available CLI options.
- `./cldevice write-device-id`: Write (overwrite) random device ID to the connected device.
- `./cldevice help write-device-id`: See help for specific command.

## Other commands
- `esptool chip-id`: Read chip ID.

## LoRa config 
The config file (`rx.json`, `tx.json`) needs to specify a `lora` object as follows:
```json
"lora": {
    "pins": { /* Choose the appropriate pins config below */ },
    "params": {
        "frequency": 868E6,
        "tx_power_level": 15,
        "signal_bandwidth": 125E3,
        "spreading_factor": 8,
        "coding_rate": 5,
        "preamble_length": 8,
        "implicit_header": false,
        "sync_word": 18,
        "enable_CRC": false,
        "invert_IQ": false,
    }
}
```

The `pins` object contains the pin layout for the specific LoRa controller (NodeMCU device). Below are two possible pin layouts, the first of which (`ESP32 TTGO v1.0`) is known to work for various devices. The `params` block can be used as-is and should usually not require any customization (although it may be possible to change the `tx_power_level`).

The `rx.json` and `tx.json` config files in this repo contains known-good configs that work for several NodeMCU models.

### Pins
**ES32 TTGO v1.0**
```json
{
    "miso": 19,
    "mosi": 27,
    "ss": 18,
    "sck": 5,
    "dio_0": 26,
    "reset": 14,
    "led": 2,
}
```

**M5Stack ATOM Matrix**
```json
{
    "miso": 23,
    "mosi": 19,
    "ss": 22,
    "sck": 33,
    "dio_0": 25,
    "reset": 21,
    "led": 12,
}
```

### LoRa params
```py
lora_parameters = {
    'frequency': 868E6,
    'tx_power_level': 15,
    'signal_bandwidth': 125E3,
    'spreading_factor': 8,
    'coding_rate': 5,
    'preamble_length': 8,
    'implicit_header': False,
    'sync_word': 0x12,
    'enable_CRC': False,
    'invert_IQ': False,
}
```