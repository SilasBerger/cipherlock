# Cipherlock
An IoT lockbox for hybrid scavenger hunts.

## Expected components
- `lockbox`
  - lockbox driver
  - controls servo to unlock box
  - receives unlock commands via LoRaWAN
  - sends ID heartbeats via LoRaWAN
- `lora-gateway`
  - converts between LoRaWAN and WebSocket
  - connected to game server via WebSocket
- `game-server`
  - holds question definitions and question <-> lockbox mapping
  - provides questions to player UI
  - sends unlock commands to lockbox
  - keeps track of lockbox heartbeats (which boxes are online?)
  - connected to lora-gateway via WebSocket
  - probably has an API key that is required for the admin UI and for the lockboxes
- `player-ui`
  - fetches question from game server and presents it to the player
  - either has a QR code scanner or a route per question
  - sends question check / unlock request to game server via HTTP or WebSocket
  - receives question check / unlock feedback
  - possibly stores correct answers for repeated unlock
- `admin-ui`
  - define questions and question <-> lockbox mappings
  - check game server status
  - check lora gateway status
  - check online status for expected boxes
- `lora-gateway-config-utility`
  - CLI or simple UI
  - configure WiFi
  - configure game server IP
