from time import sleep
from lora import lora


def send():
    counter = 0
    print("🚀 LoRa Sender")

    while True:
        payload = f"Hello ({counter})"
        print(f"Sending payload: '{payload}' RSSI: {lora.packet_rssi()}")
        lora.println(payload)

        counter += 1
        sleep(5)


send()
