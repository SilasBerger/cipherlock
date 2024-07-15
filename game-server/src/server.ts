import express from 'express';
import * as http from "http";
import bodyParser from "body-parser";
import {BehaviorSubject, tap} from "rxjs";
import {
  AnswerCheckRequest,
  CheckInRequest,
  OnboardingErrorResponse,
  GameSpec,
  OnboardingRequest,
  CheckInResponse, OnboardingSuccessResponse, AnswerCheckErrorResponse
} from "./model";
import {AdminObserver} from "./admin";
import cors from 'cors';
import {Game} from "./game";
import * as fs from "fs";
import yaml from "js-yaml";
import WebSocket, {WebSocketServer} from "ws";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3099;
const API_KEY = process.env.KEY || '33de75ea-4dfa-4d69-9ea1-8ff8435a5e45';

const $gameSpec = new BehaviorSubject<GameSpec | null>(null);

const adminObservers: AdminObserver[] = [];
let activeGame: Game | null = null;

$gameSpec.asObservable().pipe(
  tap(spec => {
    if (!!spec) {
      activeGame = new Game(spec);
    } else {
      activeGame = null;
    }
  }),
).subscribe();

const app = express();
const server = http.createServer(app);

const webSocketServer = new WebSocketServer({noServer: true});
const webSocketConnections: WebSocket[] = [];

function declineUpgrade(socket: any, message: string) {
  const responseHeaders = [
    'HTTP/1.1 400 Bad Request',
    'Connection: close',
    'Content-Type: text/plain',
    '\r\n'
  ].join('\r\n');

  socket.write(responseHeaders);
  socket.write(message);
  socket.destroy();
}

server.on('upgrade', async (request: http.IncomingMessage, socket, head) => {
  if (!request.url) {
    declineUpgrade(socket, 'Missing url');
    return;
  }

  const url = new URL(request.url.startsWith('/') ? `ws://localhost${request.url}` : request.url);

  if (url.pathname !== '/ws') {
    console.log(`Refusing connection upgrade: invalid path (${url.pathname})`);
    declineUpgrade(socket, 'Invalid path');
    return;
  }

  const apiKey = url.searchParams?.get('apiKey');
  if (apiKey !!= API_KEY) {
    console.log(`Refusing connection upgrade: missing or invalid apiKey (${apiKey}).`);
    declineUpgrade(socket, 'Invalid API key');
    return;
  }

  webSocketServer.handleUpgrade(request, socket, head, (ws) => {
    webSocketConnections.push(ws);
    console.log(`Registered WebSocket connection. We have ${webSocketConnections.length} connections now.`);
    webSocketServer.emit('connection', ws, request);
  });
});

webSocketServer.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', (data) => {
    console.log('received: %s', data);
  });

  ws.on('close', () => {
    const index = webSocketConnections.indexOf(ws);
    if (index > -1) {
      webSocketConnections.splice(index);
    }
    console.log(`WS disconnected. We have ${webSocketConnections.length} connections now.`);
  });
});

app.use(cors());
app.use(bodyParser.json({type: 'application/json'}));

if (process.env.ENV === 'dev') {
  const gameFile = fs.readFileSync('sample_data/hello_world_game.yaml', 'utf-8');
  $gameSpec.next(yaml.load(gameFile) as GameSpec);
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
  $gameSpec.next(gameSpec);

  res.status(204);
  res.send();
});

app.post('/onboard', (req, res) => {
  const onboardingRequest = req.body as OnboardingRequest;

  const playerName = onboardingRequest.playerName;
  const gameIdValid = activeGame?.gameId === onboardingRequest.gameId;
  const playerNameAvailable = !activeGame?.hasPlayerName(playerName);
  const playerNameValid = playerName.length >= 3 && playerName.length < 15;
  if (!activeGame || !gameIdValid || !playerNameAvailable || !playerNameValid) {
    res.status(409);
    res.json({
      gameActive: !!activeGame,
      gameIdValid: gameIdValid,
      playerNameAvailable: playerNameAvailable,
      playerNameValid: playerNameValid,
    } as OnboardingErrorResponse);
    return;
  }

  const playerId = activeGame.addPlayer(playerName);

  res.status(200);
  res.json({
    playerId: playerId,
  } as OnboardingSuccessResponse);
});

app.post('/checkIn', (req, res) => {
  const checkInRequest = req.body as CheckInRequest;

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

app.post('/checkAnswer', (req, res) => {
  if (!activeGame) {
    res.status(409);
    res.send('No game active.');
    return;
  }

  const answerCheckRequest = req.body as AnswerCheckRequest;

  const gameIdValid = activeGame.gameId === answerCheckRequest.gameId;
  const playerIdValid = !activeGame.requiresKnownPlayers || activeGame.hasPlayerId(answerCheckRequest.playerId);
  const questionId = answerCheckRequest.questionId;
  const questionIdValid = activeGame.hasQuestion(questionId);
  if (!gameIdValid || !playerIdValid || !questionIdValid) {
    res.status(409);
    res.send({gameIdValid, playerIdValid, questionIdValid} as AnswerCheckErrorResponse);
  }

  const result = activeGame.checkAnswer(questionId, answerCheckRequest.answer);

  if (result.correct) {
    webSocketConnections.forEach(ws => {
      ws.send(JSON.stringify({
        event: 'unlock',
        data: {
          lockboxId: activeGame?.getLockboxIdFor(questionId),
        }
      }));
    })
  }

  res.status(200);
  res.json(result);
});

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
