import time
import network
import secrets
import asyncio
import json
from servo import Servo
from ws import AsyncWebsocketClient

SERVO_PIN = 22
IDLE_ANGLE = 140
UNLOCK_ANGLE = 165
UNLOCK_DURATION_S = 0.5

wifi = network.WLAN(network.STA_IF)
wifi.active(1)
wifi.connect(secrets.WIFI_SSID, secrets.WIFI_KEY)

lock = Servo(SERVO_PIN)

lock.write(IDLE_ANGLE)


def unlock():
    lock.write(UNLOCK_ANGLE)
    time.sleep(UNLOCK_DURATION_S)
    lock.write(IDLE_ANGLE)


def handle_unlock_event(data):
    if data["lockboxId"] == secrets.DEVICE_ID:
        unlock()


def handle_event(event):
    if event["event"] == "unlock":
        handle_unlock_event(event["data"])


async def observe_websocket_events():
    ws = AsyncWebsocketClient()

    websocket_uri = f"{secrets.WEBSOCKET_CONNECTION_URL}?apiKey={secrets.SERVER_API_KEY}"
    print(f"Connecting to WebSocket server: {websocket_uri}")
    if not await ws.handshake(websocket_uri):
        raise Exception("An error occurred during WebSocket handshake")
    print("WebSocket handshake successful!")

    while await ws.open():
        event = json.loads(await ws.recv())
        handle_event(event)


asyncio.run(observe_websocket_events())
