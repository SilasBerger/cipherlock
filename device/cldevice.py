#!/usr/bin/env python3

import subprocess
import os
import sys
import shutil
import json
from pathlib import Path
from cleo.commands.command import Command
from cleo.helpers import argument, option
from cleo.application import Application


MPREMOTE = "./venv/bin/mpremote"
CONFIG_FILENAME = "config.json"  # Name of the config file on the device.
ENV_FILENAME = "env.json"  # Name of the env file on the device.
DEVICE_ID_ENV_KEY = "id"

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


def run_device_command(device, args=[], capture_output=True):
    return subprocess.run(
        [MPREMOTE, "connect", device, *args],
        check=True,
        capture_output=capture_output,
        text=True,
    ).stdout


def read_env_if_available(device_path):
    try:
        return json.loads(run_device_command(device_path, ["fs", "cat", f":{ENV_FILENAME}"]).strip())
    except Exception as e:
        return {}


def list_available_devices():
    try:
        result = subprocess.run(
            [MPREMOTE, "connect", "list"],
            check=True,
            capture_output=True,
            text=True,
        )

        entries = result.stdout.strip().split('\n')
        device_entries = [entry for entry in entries if entry.startswith(USB_PREFIX_WIN) or entry.startswith(USB_PREFIX_MACOS) or entry.startswith(USB_PREFIX_LINUX)]

        devices = []
        for descriptor in device_entries:
            device_path = descriptor.split(" ")[0]
            
            device = {
                "path": device_path,
                "descriptor": descriptor,
                
            }

            env = read_env_if_available(device_path)
            if env:
                if "id" in env:
                    device["id"] = env["id"]
                if "name" in env:
                    device["name"] = env["name"]        

            devices.append(device)

        return devices, None
    except Exception as e:
        return None, str(e)


def mpremote(args, capture_output=True):
    global device_path

    if not device_path:
        devices, error = list_available_devices()
        if error:
            exit_with_error(error_msg=f"Failed to list available devices: {error}.")
        
        if len(devices) == 0:
            exit_with_error(error_msg="No devices available.")
        
        if len(devices) > 1:
            print("Multiple devices found:")
            for index, device in enumerate(devices):
                option_str = device["descriptor"]
                if "id" in device:
                    option_str = f"{device["name"]} (id={device["id"]}; {device["path"]})" if "name" in device else f"id={device["id"]} ({device["path"]})"
                print(f"[{index}] {option_str}")

            try:
                selected_id = int(input("\nSelect device number: "))
                if selected_id > len(devices) - 1:
                    raise Exception(f"Device number out of range: {selected_id}.")
                device_path = devices[selected_id]["path"]
            except Exception as e:
                exit_with_error(error_msg=str(e))
        else:
            device_path = devices[0]["path"]

    return run_device_command(device_path, args, capture_output)


def ensure_env():
    try:
        return json.loads(mpremote(["fs", "cat", f":{ENV_FILENAME}"]).strip())
    except Exception as e:
        mpremote(["fs", "touch", f":{ENV_FILENAME}"])
        return {}


def write_env(entries):
    env = ensure_env()

    for entry in entries:
        if "=" not in entry:
            exit_with_error(error_msg=f"Found invalid env entry: {entry}. Use key=value pairs.")

    for entry in entries:
        key, value = entry.split("=", 1)
        env[key] = value

    with open(ENV_FILENAME, "w", encoding="utf-8") as f:
        json.dump(env, f, indent=2)
    try:
        mpremote(["fs", "cp", ENV_FILENAME, f":{ENV_FILENAME}"])
    except Exception as e:
        exit_with_error(error_msg=str(e))
    finally:
        os.remove(ENV_FILENAME)


def remove_env_keys(keys, command):
    env = ensure_env()

    for key in keys:
        if key in env:
            del env[key]
        else:
            command.line(f"<error>Key {key} not in device's env - skipping…</error>")

    with open(ENV_FILENAME, "w", encoding="utf-8") as f:
        json.dump(env, f, indent=2)
    try:
        mpremote(["fs", "cp", ENV_FILENAME, f":{ENV_FILENAME}"])
    except Exception as e:
        exit_with_error(error_msg=str(e))
    finally:
        os.remove(ENV_FILENAME)


def read_device_id():
    env = ensure_env()
    return env[DEVICE_ID_ENV_KEY] if DEVICE_ID_ENV_KEY in env else None


def verify_device_id_or_fail(command = None):
    existing_device_id = read_device_id()

    if not existing_device_id:
        exit_with_error(command, 'No device ID found on the device - run `write-device-id` first!')


def write_device_id(device_id, command = None):
    write_env([f"{DEVICE_ID_ENV_KEY}={device_id}"])


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
        verify_device_id_or_fail(self, overwrite=False)
        error = write_config(self.argument("config"))
        if error:
            exit_with_error(self, f"Encountered error while trying to write config: {error}. Installation aborted.")
        self.line("<comment>Cipherlock firmware installed successfully!</comment>")


class UninstallCommand(Command):
    name = "uninstall"
    description = "Uninstall Cipherlock firmware from the connected device. Does not delete configuration files, such as config or env."
    options = [
        option("all", "a", "Remove all files, including configuration files (config, env, etc.), excluding bootloader.", flag=True),
    ]

    PROTECTED_ROOT_FILES = [
        "boot.py",
    ]

    OPTIONAL_PROTECTED_ROOT_FILES = [
        CONFIG_FILENAME,
        ENV_FILENAME
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


class ReadEnvCommand(Command):
    name = "read-env"
    description = "Dump the device's .env file."

    def handle(self):
        env = ensure_env()
        self.line(json.dumps(env, indent=2))


class WriteEnvCommand(Command):
    name = "write-env"
    description = "Write env key-value pairs to the device."

    arguments = [
        argument("entries", "The key=value pair(s) to write to the device's env.", optional=False, multiple=True)
    ]

    def handle(self):
        write_env(self.argument("entries"))
        self.line("<comment>Env updated successfully.</comment>")


class RemoveEnvKeyCommand(Command):
    name = "remove-env-key"

    arguments = [
        argument("keys", "The key(s) to delete from the device's env.", optional=False, multiple=True)
    ]

    def handle(self):
        remove_env_keys(self.argument("keys"), self)
        self.line("<comment>Env updated successfully.</comment>")


class ReadDeviceIdCommand(Command):
    name = "read-device-id"
    description = "Read the device ID from the connected device."

    def handle(self):
        device_id = read_device_id()
        self.line(f"<comment>Device ID: {device_id}</comment>")


class WriteDeviceIdCommand(Command):
    name = "write-device-id"
    description = "Write a new device ID to the connected device. Device ID must be an integer in the range [0, 254] where 0 is reserved for the gateway."

    arguments = [
        argument("id", "The device ID to write to this device (int, [0, 254]).", optional=False)
    ]

    def handle(self):
        try:
            device_id = int(self.argument("id"))
            if not 0 <= device_id <= 254:
                raise Exception(f"Device ID out of range (0-254): {device_id}.")
            write_device_id(device_id, command=self)
            self.line(f"<comment>Device ID written successfully: {device_id}</comment>")
        except Exception as e:
            exit_with_error(self, str(e))

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

        verify_device_id_or_fail(self)

        if build_path.exists():
            shutil.rmtree(build_path)
        shutil.copytree(src_path, build_path)

        config, error = read_config()
        if error:
            exit_with_error(self, "Error reading config on device. Write config to the device to fix this issue.")
        with open(build_path / 'config.json', "w") as outfile:
            json.dump(json.loads(config), outfile, indent=2)

        env = ensure_env()
        if not env:
            exit_with_error(self, "Unexpected error: Unable to read device env.")
        with open(build_path / ENV_FILENAME, "w") as outfile:
            json.dump(env, outfile)

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
application.add(ReadEnvCommand())
application.add(WriteEnvCommand())
application.add(RemoveEnvKeyCommand())
application.add(ReadDeviceIdCommand())
application.add(WriteDeviceIdCommand())
application.add(ReadConfigCommand())
application.add(WriteConfigCommand())
application.add(DevCommand())
application.add(ReadErrorLogCommand())
application.add(ListDevicesCommand())


if __name__ == "__main__":
    application.run()
