import json
import lora
from time import sleep
import uasyncio as asyncio


async def rx(lora_conn):
    print("🚀 LoRa Receiver")

    while True:
        try:
            msg = await lora_conn.recv()
            print('\n=== Received payload ===')
            print(msg)

        except Exception as e:
            print("RX error:", e)
            await asyncio.sleep(1)

async def tx(lora_conn):
    counter = 0
    print("🚀 LoRa Sender")

    while True:
        payload = f"Hello ({counter})"
        print(f"Sending payload: '{payload}'")
        await lora_conn.send(payload)

        counter += 1
        await asyncio.sleep(5)


async def main():
    with open('config.json', 'r') as infile:
        config = json.load(infile)

    lora_conn = lora.init(config["lora"]["pins"], config["lora"]["params"])

    if config['role'] == 'tx':
        asyncio.create_task(tx(lora_conn))
    elif config['role'] == 'rx':
        asyncio.create_task(rx(lora_conn))
    else:
        print(f"Unknown role: {config['role']}")

    # Keep main alive forever
    while True:
        await asyncio.sleep(3600)


asyncio.run(main())
