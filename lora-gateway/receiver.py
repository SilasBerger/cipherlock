import network
import secrets
import urequests
from lora import lora


wifi = network.WLAN(network.STA_IF)
wifi.active(True)
wifi.connect(secrets.network_ssid, secrets.network_key)


def receive():
    print("🚀 LoRa Receiver")

    while True:
        if lora.received_packet():
            lora.blink_led()
            print('\n=== Received payload ===')
            payload = lora.read_payload()
            print(payload)
            if wifi.isconnected():
                urequests.post(f'{secrets.server_url}/lora-ping')
                print('✅ Ping sent')

receive()
