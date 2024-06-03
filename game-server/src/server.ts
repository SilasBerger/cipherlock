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
  CheckInResponse, OnboardingSuccessResponse
} from "./model";
import {AdminObserver} from "./admin";
import cors from 'cors';
import {Game} from "./game";

const PORT = 3099;
const API_KEY = 'key1234';

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

  const gameIdValid = activeGame?.gameId === onboardingRequest.gameId;
  const playerNameAvailable = !activeGame?.hasPlayerName(onboardingRequest.playerName);
  if (!activeGame || !gameIdValid || !playerNameAvailable) {
    res.status(409);
    res.json({
      gameActive: !!activeGame,
      gameIdValid: gameIdValid,
      playerNameAvailable: playerNameAvailable,
    } as OnboardingErrorResponse);
    return;
  }

  const playerId = activeGame.addPlayer(onboardingRequest.playerName);

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
  const answerCheckRequest = req.body as AnswerCheckRequest;
  /*
  - check if game active
  - check if correct gameId
  - of known players required, check if id is known
  - game / question checker needs to have a "veto" (not just true/false for correct/incorrect)
    - handle unknown player (throw exception; should be checked before?)
    - check if question with questionId exists
    - have answer checked for correctness
    - have points awarded if correct (consider first try, second try, ...)
  - have box opened if correct
  - give feedback (correctness, points, unknown player, incorrect gameId, ...)
   */
});

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
