# Cipherlock Device
## Basic setup
### CLI setup
1. Install the appropriate MicroPython firmware on the device (https://github.com/SilasBerger/nodemcu-setup)
2 Create a virtualenv: `python3 -v venv venv`
3. Activate it: `source venv/bin/activate`
4. Install requirements: `pip install -r requirements.txt`
5. Make sure `cldevice.py` is executable: `chmod +x cldevice.py`

### Configuration and environment setup
**Note:** During this initial setup, it is recommended to only connect a single device to the host computer at a time, to avoid confusion between multiple devices.

To install a configuration file to the device, run:

```sh
./cldevice write-config /path/to/config.json`
```

Default config files are:
- `configs/box.json` for Cipherlock boxes
- `configs/gateway.json` for the LoRa gateway

Then, set up the device's environment by running:

```sh
./cldevice write-env key=value1 [key2=value2 ...]
```

The following environment variables are supported:

| Key | Possible values | Meaning | Required? |
| --- | --------------- | ------- | --------- |
| id | `0`-`254` | The device's ID, used as `src` and `dst` in transmissions | required |
| name | `str` | The device's name, primarily used for disambiguation in the CLI if multiple devices are connected | optional |

### Installing the firmware
To install the firmware on a connected device, run:

```sh
./cldevice install
```

If you need to remove installed firmware, run `./cldevice uninstall` (leaves configuration files such as config and env intact) or `./cldevice uninstall --all` (also removes configuration files, only leaves bootloader intact).

**For development:** Instead of installing the firmware, you can run `./cldevice dev` to run the current contents of the `src` directory on the device.

### Other useful commands
- `./cldevice help`: See help for the CLDevice CLI
- `./cldevice read-config`, `./cldevice read-env`: Read the currently installed config / env
- `./cldevice remove-env-key key1 [key2...]`: Remove env key(s)
- `./esptool chip-id`: Read chip ID
- `./mpremote help`: See available commands for the raw MicroPython remote control tool

## Additional setup information
### LoRa config 
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

#### Pins
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

## Cipherlock Datagram Protocol (CDP)
- Targeted frame size: 20-80 bytes.
- A frame is uniquely identified by the combination of `(src, seq)`. The `src` is needed because very node has its individual `seq` counter.

### CDP frame
```
| version (1B)
| flags   (1B)
| ttl     (1B)
| src     (1B)
| dst     (1B)
| seq     (2B)  # per device, starting at 1
| ack_seq (2B)   # 0 if not ACK
| payload_len (1B)
| payload (0–237B)
| mac (8B)
```

### Flags
```
bit 0 -> NO_ACK (do not acknowledge this packet)
bits 1-7 -> RESERVED (future)
```

### `src` and `dst`
```
0 = gateway
255 = broadcast
```

### Payload
```
| opcode (1B)
| opcode_args (0-236B)
```

Opcodes may define the remainder of the payload as arguments in a per-opcode custom format.

### Opcodes
```
0x00 = heartbeat (NO_ACK)
0x01 = open box
```