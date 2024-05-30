# Cipherlock
An IoT lockbox for hybrid scavenger hunts.

Player and admin UI are not part of this project. They are developed individually and use the provided endpoints. For an example, see [here](https://github.com/SilasBerger/teaching-website/compare/main...feature/cipherlock).

## Expected components to be implemented
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
  - possibly has a concept of player teams and points (awarded for fast answers, small number of tries, etc.)
- `lora-gateway-config-utility`
  - CLI or simple UI
  - configure WiFi
  - configure game server IP
