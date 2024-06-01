import express from 'express';
import * as fs from "fs";
import yaml from 'js-yaml';
import {Server} from 'socket.io';
import * as http from "http";
import bodyParser from "body-parser";
import {BehaviorSubject} from "rxjs";
import {GameSpec} from "./model";
import {AdminObserver} from "./admin";

const PORT = 3099;
const API_KEY = 'key1234';

const $gameSpec = new BehaviorSubject<GameSpec | null>(null);

const adminObservers: AdminObserver[] = [];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

app.use(bodyParser.text({type: 'application/yaml'}));

io.use((socket, next) => {
  if (socket.request.headers.apikey === API_KEY) {
    next();
  } else {
    next(new Error('Invalid API key'));
  }
});

io.on('connection', socket => {
  const observer = new AdminObserver(socket, $gameSpec);
  adminObservers.push(observer);

  socket.on('disconnect', () => {
    adminObservers.splice(adminObservers.indexOf(observer), 1);
  });
});

app.post('/game', (req, res) => {
  if (!req.is('application/yaml')) {
    res.status(400);
    res.send('Bad type: Payload must be application/yaml.');
    return;
  }

  const gameSpec: GameSpec = yaml.load(req.body) as GameSpec;
  $gameSpec.next(gameSpec);

  res.status(204);
  res.send();
});

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
