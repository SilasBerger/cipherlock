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