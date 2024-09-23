import express from 'express';
import * as http from "http";
import bodyParser from "body-parser";
import {
  CheckInRequest,
  CheckInResponse,
  GameSpec,
  OnboardingErrorResponse,
  OnboardingRequest,
  OnboardingSuccessResponse
} from "./model";
import cors from 'cors';
import * as fs from "fs";
import yaml from "js-yaml";
import {Engine} from "./core/engine";
import {SocketServer} from "./socket";
import router from "./routes/router";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3099;
const API_KEY = process.env.KEY || '33de75ea-4dfa-4d69-9ea1-8ff8435a5e45';

const app = express();
const server = http.createServer(app);
const socketServer = SocketServer.create(API_KEY);

Engine.setup(socketServer);

server.on('upgrade', async (request, socket, head) => socketServer.handleUpgrade(request, socket, head));

app.use(cors());
app.use(bodyParser.json({type: 'application/json'}));

if (process.env.ENV === 'dev') {
  const gameFile = fs.readFileSync('sample_data/demo_game.yaml', 'utf-8');
  Engine.instance.updateGameSpec(yaml.load(gameFile) as GameSpec);
}

function pathSegments(path: string): string[] {
  return path.split('/').filter(segment => !!segment);
}

app.use((req, res, next) => {
  if (pathSegments(req.path)[0] === 'admin' && req.headers.apikey !== API_KEY) {
    res.status(401);
    res.send();
    return;
  }

  next();
});

app.post('/admin/game', (req, res) => {
  if (!req.is('application/json')) {
    res.status(400);
    res.send('Bad type: Payload must be application/json.');
    return;
  }

  const gameSpec: GameSpec = req.body as GameSpec;
  Engine.instance.updateGameSpec(gameSpec);

  res.status(204);
  res.send();
});

app.post('/onboard', (req, res) => {
  const onboardingRequest = req.body as OnboardingRequest;
  const activeGame = Engine.instance.activeGame;

  const playerName = onboardingRequest.playerName;
  const gameIdValid = activeGame?.gameId === onboardingRequest.gameId;
  const playerNameAvailable = !activeGame?.hasPlayerName(playerName);
  const playerNameValid = playerName.length >= 3 && playerName.length < 15;
  if (!activeGame || !gameIdValid || !playerNameAvailable || !playerNameValid) {
    res.status(409);
    res.json({
      gameActive: Engine.instance.isGameActive,
      gameIdValid: gameIdValid,
      playerNameAvailable: playerNameAvailable,
      playerNameValid: playerNameValid,
    } as OnboardingErrorResponse);
    return;
  }

  const playerId = activeGame!.addPlayer(playerName);

  res.status(200);
  res.json({
    playerId: playerId,
  } as OnboardingSuccessResponse);
});

app.post('/checkIn', (req, res) => {
  const checkInRequest = req.body as CheckInRequest;
  const activeGame = Engine.instance.activeGame;

  if (!activeGame) {
    res.status(409);
    res.send('No game active.');
    return;
  }

  const gameIdValid = activeGame.gameId === checkInRequest.gameId;
  const playerIdValid = !activeGame.requiresKnownPlayers || activeGame.hasPlayerId(checkInRequest.playerId);

  res.status(200);
  res.json({
    gameIdValid: gameIdValid,
    playerIdValid: playerIdValid,
    success: gameIdValid && playerIdValid,
  } as CheckInResponse);
});

app.use(router);

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
