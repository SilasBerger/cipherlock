# Cipherlock
An IoT lockbox for hybrid scavenger hunts.

## Overview
Cipherlock is an IoT-based lockbox for hybrid scavenger hunts.

### The basic principle
(TODO: Basic principle: admin writes and loads game spec, players POST answer, GS sends unlock command via WS, gateway relays via LoRa, box unlocks)

(TODO: The moving parts; maybe a diagram)

### What's in this repository?
This repository contains the code for the following components of Cipherlock:
- `game-server`: The web API that contains the core game logic, such as receiving player answers and triggering lockboxes to unlock.  
- `lockbox`: The ESP32-based lockbox controller.
- `lora-gateway`: **Not yet implemented.**

### What's NOT in this repository?
- CAD files (not currently available to the public)
- Player and admin frontends (not part of this project; see [Implementing a user interface](#implementing-a-user-interface))
- Basic ESP32 development board setup (see [Flashing the Micropython firmware](#flashing-the-micropython-firmware))

## Usage
When setting up Cipherlock, it is recommended that you first complete the _external tasks_ outlined below, before proceeding with the deployment of Cipherlock itself.

### External tasks
#### Flashing the Micropython firmware
This project requires the [Micropython firmware](https://docs.micropython.org/en/latest/esp32/tutorial/index.html) to be installed on all ESP32 devices.

Clone [this repository](https://github.com/SilasBerger/nodemcu-setup) and follow the instructions outlined in the README to flash the appropriate Micropython firmware onto the ESP32 device. There, you can also find general information on how to interact with an ESP32 device through a serial connection (REPL and file transfer).

#### Implementing a user interface
Player and admin UI are not part of this project. They are developed individually and use the provided endpoints. For an example, see [here](https://github.com/SilasBerger/teaching-website/tree/feature/cipherlock-first-unlock).

#### 3D-printing and assembling the hardware
Print all the required parts and assemble the lockbox. For instructions, see [here](#hardware-assembly-instructions).

### Game server deployment
TODO

### Lockbox controller setup
Unless stated otherwise, all commands within this section need to be run from within the `lockbox` subdirectory.

#### First-time setup
If you haven't deployed to a lockbox controller from this machine (or this repository clone) before, first make sure to create and activate a _virtualenv_ and run `pip install -f requirements.txt` from within the **root of this repository**.

Then, from within the `lockbox` subdirectory, run

```shell
cp config.example.py config.py 
```

and edit the newly created `config.py` file to fit your specific configuration. **This file should never be checked into source control!**

Finally, run

```shell
chmod +x deploy.sh
```

to complete the first-time setup.

#### Deploying to the first lockbox controller
The following steps are ideally done immediately after a fresh firmware flash (see [flashing the Micropython firmware](#flashing-the-micropython-firmware)).

Connect the target ESP32 to your computer and run

```shell
./esptool.py chip_id | grep "Serial port"
```

to determine its serial port.

Then, run 

```shell
./deploy.sh <serial_port>
```

to deploy all files to the device.

#### Deploying to further lockbox controllers
To set up additional lockbox controllers, you will need to edit the `DEVICE_ID` value in `config.py` before each deployment. Each lockbox needs to have an individual numeric id between `1` and `255`.

Once the configuration has been updated for the next deployment, follow the same steps as when [Deploying to the first lockbox controller](#deploying-to-the-first-lockbox-controller).

#### Updating individual files
When updating individual files (such as `config.py`) on a previously deployed lockbox controller, run

```shell
./deploy <serial_port> <filename>
```

to copy only the specified file to the device.

### LoRa gateway setup
The LoRa gateway is not yet implemented. Currently, the lockbox controller connects directly to the game server via WiFi.

## Hardware assembly instructions
_Please note that the CAD files for this project are not currently available to the public._

TODO
