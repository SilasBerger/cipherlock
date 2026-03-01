import json
import lora
from time import sleep


def rx(lora_conn):
    print("🚀 LoRa Receiver")

    while True:
        if lora_conn.received_packet():
            lora_conn.blink_led()
            print('\n=== Received payload ===')
            payload = lora_conn.read_payload()
            print(payload)


def tx(lora_conn):
    counter = 0
    print("🚀 LoRa Sender")

    while True:
        payload = f"Hello ({counter})"
        print(f"Sending payload: '{payload}' RSSI: {lora_conn.packet_rssi()}")
        lora_conn.println(payload)

        counter += 1
        sleep(5)


def main():
    with open('config.json', 'r') as infile:
        config = json.load(infile)
    
    print(config)
    
    lora_conn = lora.init(config["lora"]["pins"], config["lora"]["params"])
    if config['role'] == 'tx':
        tx(lora_conn)
    elif config['role'] == 'rx':
        rx(lora_conn)
    else:
        print(f'Unknown role: {config['role']}')


main()