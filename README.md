# 🚧 Cipherlock [WIP]
An IoT lockbox for hybrid scavenger hunts.

**Note:** Cipherlock is still under construction. A first proof-of-concept has resulted in a working lockbox prototype. This prototype is currently being reworked and upgraded and the game server will be reimplemented as well.

## Overview
### The basic principle
Cipherlock consists of three main components: 
- `device`: The ESP32 / LoRa firmware for both the lockbox controller and LoRa gateway hardware.
- `api`: The game server.

The _lockbox_ is a 3D-printed treasure chest that cannot be manually opened from the outside. When players want to open a box, they must first complete a challenge online (to which they might for instance get by scanning a QR code attached to the box). Once the challenge is completed, the corresponding box will receive a signal over a network telling it to open. After players have removed or used its contents, they can manually close it again.

### What's in this repository?
This repository contains the code for the following components of Cipherlock:
- `device`: The ESP32 device firmware for both the lockbox controllers and LoRa gateway. 
- `api`: The game server.

### What's NOT in this repository?
- CAD files (not currently available to the public)
- Player and admin frontends (not part of this project; see [Implementing a user interface](#implementing-a-user-interface))
- Basic ESP32 development board setup

## Usage
When setting up Cipherlock, it is recommended that you first complete the _external tasks_ outlined below, before proceeding with the deployment of Cipherlock itself.

### Firmware setup
Follow the usage guide in [this README](device/README.md) for instructions on how to install the lockbox controller and LoRa gateway device firmware.

### Deploying the game server
Not yet implemented.

### 3D-printing and assembling the hardware
Print all the required parts and assemble the lockbox. For instructions, see [here](doc/assembly.md).

### Implementing a user interface
Player and admin UI are not part of this project. They are developed individually and use the provided endpoints. For an example, see [here](https://github.com/SilasBerger/teaching-website/tree/feature/cipherlock-first-unlock).


