import express from 'express';
import {Server} from 'socket.io';
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

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3099;
const API_KEY = process.env.KEY || 'key1234';

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
const io = new Server(server, {
  cors: {
    origin: '*',
  }
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

io.use((socket, next) => {
  if (socket.request.headers.apikey === API_KEY) {
    next();
  } else {
    next(new Error('API key missing or invalid.'));
  }
});

io.on('connection', socket => {
  const observer = new AdminObserver(socket, $gameSpec);
  adminObservers.push(observer);

  socket.on('disconnect', () => {
    adminObservers.splice(adminObservers.indexOf(observer), 1);
  });
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
  const questionIdValid = activeGame.hasQuestion(answerCheckRequest.questionId);
  if (!gameIdValid || !playerIdValid || !questionIdValid) {
    res.status(409);
    res.send({gameIdValid, playerIdValid, questionIdValid} as AnswerCheckErrorResponse);
  }

  const result = activeGame.checkAnswer(answerCheckRequest.questionId, answerCheckRequest.answer);

  if (result.correct) {
    // TODO: Have box unlocked.
  }

  res.status(200);
  res.json(result);
});

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
