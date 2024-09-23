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

// TODO: This should be handled by an auth config solution (see teaching-api).
app.use((req, res, next) => {
  if (pathSegments(req.path)[0] === 'admin' && req.headers.apikey !== API_KEY) {
    res.status(401);
    res.send();
    return;
  }

  next();
});

app.use(router);

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
