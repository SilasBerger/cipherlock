# game-server
## Endpoints
### /admin/game
**Authenticated**: Requires `apikey` header.

Publish a game.

```typescript
see: sample_data/hello_world_game.yaml
```

**204 NO CONTENT** \
Game published successfully.

**400 BAD REQUEST** \
Payload is not `application/json` or does not match the expected `GameFile` model.

**401 UNAUTHORIZED** \
`apikey` header missing or invalid.

### /checkIn
Check whether the client is using the appropriate game coordinates. A call to this endpoint is not required, but an unsuccessful result indicates that subsequent answer checking requests will fail.

```typescript
{
  gameId: string; /* ID of the game expected to currently be active. */
  playerId?: string; /* Client's playerId. */
}
```

**200 OK** \
The check-in request was successful but the check-in may still have failed.
```typescript
{
  gameIdValid: boolean, /* False if the provided gameId does not match the currently active game's ID. */
  playerIdValid: boolean, /* False if the currently active game requires know players but has no record of the provided playerId. */
  success: boolean, /* False if unexpected values were provided, indicating the subsequent answer checking requests will fail. */
}
```

**409 CONFLICT** \
No game active.

### /onboard
Onboard a new player to the game.

```typescript
{
  gameId: string; /* ID of the game expected to currently be active. */
  playerName: string; /* Desired player name. */
}
```

***200 OK** \
```typescript
{
  playerId: string; /* The generated and registered playerId, potentially required in subsequent requests. */
}
```

**409 CONFLICT** \
```typescript
{
  gameActive: boolean; /* Whether a game is currently active. */
  gameIdValid: boolean; /* Whether the provided gameId matches the currently active game's ID. Meaningless if gameActive is false.  */
  playerNameAvailable: boolean; /* Whether the provided playerName is available. Meaningless if gameActive is false. */
}
```

### /socket.io
Establish Socket.io connection.

```typescript
{
  apikey: string /* Server's API key, used as authentication. */
}
```
