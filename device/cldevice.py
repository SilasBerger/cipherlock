#!/usr/bin/env python3

import subprocess
import uuid
import os
import sys
import shutil
import json
from pathlib import Path
from cleo.commands.command import Command
from cleo.helpers import argument, option
from cleo.application import Application


MPREMOTE = "./venv/bin/mpremote"
DEVICE_ID_FILENAME = "device_id"  # Name of the device ID file on the device.
CONFIG_FILENAME = "config.json"  # Name of the config file on the device.

USB_PREFIX_WIN = "COM"
USB_PREFIX_MACOS = "/dev/cu.usbserial"
USB_PREFIX_LINUX = "/dev/tty"

device_path = None


def exit_with_error(command = None, error_msg = "Unknown error."):
    if command:
        command.line(f"<error>{error_msg}</error>")
    else:
        print(error_msg, file=sys.stderr)
    sys.exit(1)


def list_available_devices():
    try:
        result = subprocess.run(
            [MPREMOTE, "connect", "list"],
            check=True,
            capture_output=True,
            text=True,
        )

        entries = result.stdout.strip().split('\n')
        devices = [entry for entry in entries if entry.startswith(USB_PREFIX_WIN) or entry.startswith(USB_PREFIX_MACOS) or entry.startswith(USB_PREFIX_LINUX)]

        return devices, None
    except Exception as e:
        return None, str(e)


def mpremote(args, capture_output=True):
    global device_path

    devices, error = list_available_devices()
    if error:
        exit_with_error(error_msg=f"Failed to list available devices: {error}.")
    
    device_paths = [device.split(" ")[0] for device in devices]
    if len(devices) == 0:
        exit_with_error(error_msg="No devices available.")
    
    if len(devices) > 1 and not device_path:
        print("Multiple devices found:")
        for index, device in enumerate(devices):
            print(f"[{index}] {device}")

        try:
            selected_id = int(input("\nSelect device number: "))
            if selected_id > len(devices) - 1:
                raise Exception(f"Device number out of range: {selected_id}.")
            device_path = device_paths[selected_id]
        except Exception as e:
            exit_with_error(error_msg=str(e))

    return subprocess.run(
        [MPREMOTE, "connect", device_path, *args],
        check=True,
        capture_output=capture_output,
        text=True,
    ).stdout


def read_device_id():
    try:
        return mpremote(["fs", "cat", ":device_id"]).strip()
    except Exception as e:
        return None
    

def ensure_device_id(command = None, overwrite = False, device_id = None):
    existing_device_id = read_device_id()
    if existing_device_id is not None and not overwrite:
        return

    if not device_id:
        device_id = uuid.uuid4()
    
    with open(DEVICE_ID_FILENAME, "w") as f:
        f.write(str(device_id))
    try:
        mpremote(["fs", "cp", DEVICE_ID_FILENAME, ":device_id"])
        return device_id
    except Exception as e:
        exit_with_error(command, str(e))
    finally:
        os.remove(DEVICE_ID_FILENAME)


def read_config():
    try:
        result = mpremote(["fs", "cat", ":config.json"])
        return result.strip(), None
    except Exception as e:
        return None, str(e)


def write_config(config_file):
    try:
        mpremote(["fs", "cp", config_file, ":config.json"])
    except Exception as e:
        return str(e)
    return None


class InstallCommand(Command):
    name = "install"
    description = "Install the Cipherlock firmware on the connected device."

    arguments = [
        argument("config", "The config file to write to the device during installation.", optional=False)
    ]

    def handle(self):
        # ./mpremote fs cp -r src/* :
        self.line("Installing Cipherlock firmware...")
        src_files = [str(p) for p in Path("src").glob("*")]
        mpremote(["fs", "cp", "-r"] + src_files + [":"], capture_output=False)
        ensure_device_id(self, overwrite=False)
        error = write_config(self.argument("config"))
        if error:
            exit_with_error(self, f"Encountered error while trying to write config: {error}. Installation aborted.")
        self.line("<comment>Cipherlock firmware installed successfully!</comment>")


class UninstallCommand(Command):
    name = "uninstall"
    description = "Uninstall Cipherlock firmware from the connected device. Does not delete auxiliary files, such as device ID or config."
    options = [
        option("all", "a", "Remove all files, including auxiliary files (device ID, config, etc.).", flag=True),
    ]

    PROTECTED_ROOT_FILES = [
        "boot.py",
    ]

    OPTIONAL_PROTECTED_ROOT_FILES = [
        DEVICE_ID_FILENAME,
        CONFIG_FILENAME,
    ]

    def handle(self):
        self.line("Removing firmware files...")
        
        # Get list of files/directories at root
        result = mpremote(["fs", "ls", ":"])

        protected_files = self.PROTECTED_ROOT_FILES if self.option("all") else self.PROTECTED_ROOT_FILES + self.OPTIONAL_PROTECTED_ROOT_FILES
        entries = [" ".join(line.strip().split(" ")[1:]) for line in result.split("\n")]
        entries = [entry for entry in entries if entry != ":" and entry != "" and entry not in protected_files]

        for entry in entries:
            delete_cmd = [
                "fs", 
                "rm", 
                "-r", 
                f":{entry}"
            ]
            mpremote(delete_cmd, capture_output=False)

        self.line("<comment>Cleanup complete.</comment>")


class ReadDeviceIdCommand(Command):
    name = "read-device-id"
    description = "Read the device ID from the connected device."

    def handle(self):
        device_id = read_device_id()
        self.line("<comment>Device ID: {}</comment>".format(device_id))


class WriteDeviceIdCommand(Command):
    name = "write-device-id"
    description = "Write a new device ID to the connected device. The ID is auto-generated by default."

    options = [
        option("id", "i", "Use this UUID as the device ID, rather than auto-generating.", flag=False)
    ]

    def handle(self):
        device_id = ensure_device_id(self, overwrite=True, device_id=self.option("id"))
        self.line(f"<comment>Device ID written successfully: {device_id}</comment>")


class ReadConfigCommand(Command):
    name = "read-config"
    description = "Read the configuration from the connected device."

    def handle(self):
        config, error = read_config()
        if error:
            exit_with_error(self, f"Error reading config: {error}.")
        self.line(config)


class WriteConfigCommand(Command):
    name = "write-config"
    description = "Write the configuration to the connected device."
    arguments = [
        argument("config", "The configuration file to write.", optional=False)
    ]

    def handle(self):
        config_file = self.argument("config")
        error = write_config(config_file)
        if error:
            exit_with_error(f"Failed to write configuration file: {error}.")
        else:
            self.line("<comment>Configuration file written successfully.</comment>")


class DevCommand(Command):
    name = "dev"
    description = "Run the contents of the `src` directory on the device, using `main.py` as the entry point and using the `device_id` and `config.json` files from the device."

    def handle(self):
        src_path = Path('src')
        build_path = Path('build')

        ensure_device_id(self)

        if build_path.exists():
            shutil.rmtree(build_path)
        shutil.copytree(src_path, build_path)

        config, error = read_config()
        if error:
            exit_with_error(self, "Error reading config on device. Write config to the device to fix this issue.")
        with open(build_path / 'config.json', "w") as outfile:
            json.dump(json.loads(config), outfile, indent=2)

        device_id = read_device_id()
        if not device_id:
            exit_with_error(self, "Unexpected error: Unable to read device ID.")
        with open(build_path / DEVICE_ID_FILENAME, "w") as outfile:
            outfile.write(device_id)

        mpremote(["mount", "build/", "exec", "import main"], capture_output=False)


class ReadErrorLogCommand(Command):
    name = "read-error-log"
    description = "Read the error log on the device."

    def handle(self):
        try:
            result = json.loads(mpremote(["fs", "cat", ":error.log.json"]).strip())
            for index, log_line in enumerate(result):
                self.line(f"Entry {index + 1}: <error>{log_line}</error>")
        except Exception as e:
            self.line("<comment>No error log found.</comment>")


class ListDevicesCommand(Command):
    name = "list-devices"
    description = "List the USB devices available for connection."

    def handle(self):
        devices, error = list_available_devices()
        if error:
            exit_with_error(self, f"Error listing devices: {error}.")
        self.line(devices)

        
application = Application()
application.add(InstallCommand())
application.add(UninstallCommand())
application.add(ReadDeviceIdCommand())
application.add(WriteDeviceIdCommand())
application.add(ReadConfigCommand())
application.add(WriteConfigCommand())
application.add(DevCommand())
application.add(ReadErrorLogCommand())
application.add(ListDevicesCommand())


if __name__ == "__main__":
    application.run()
