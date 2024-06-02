import express from 'express';
import {Server} from 'socket.io';
import * as http from "http";
import bodyParser from "body-parser";
import {BehaviorSubject, tap} from "rxjs";
import {AnswerCheckRequest, CheckInRequest, OnboardingResponse, GameSpec, OnboardingRequest} from "./model";
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
    if (spec) {
      activeGame = new Game(spec);
    } else {
      activeGame = null;
    }
  }),
);

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
  console.log(req.headers);
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

  if (!activeGame) {
    res.status(409);
    res.json({} as OnboardingResponse);
    return;
  }

  const playerNameAvailable = !activeGame.hasPlayerName(onboardingRequest.playerName);
  if (activeGame.gameId !== onboardingRequest.gameId || !playerNameAvailable) {
    res.status(409);
    res.json({
      gameId: activeGame.gameId,
      playerNameAvailable: playerNameAvailable,
    } as OnboardingResponse);
    return;
  }

  const playerId = activeGame.addPlayer(onboardingRequest.playerName);

  res.status(200);
  res.json({
    gameId: activeGame.gameId,
    playerNameAvailable: playerNameAvailable,
    playerId: playerId,
  } as OnboardingResponse);
});

app.post('/checkIn', (req, res) => {
  const checkInRequest = req.body as CheckInRequest;
  /*
  if (!activeGame) {
    fail, invalid state
  }

  if (checkInRequest !== activeGame.gameId || !game.hasPlayer(checkInRequest.playerId)) {
    200; check-in result: failure
  }

  200: check-in result: success
   */
});

app.post('/checkAnswer', (req, res) => {
  const answerCheckRequest = req.body as AnswerCheckRequest;
});

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
