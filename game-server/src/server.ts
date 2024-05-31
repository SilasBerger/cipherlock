import express from 'express';
import * as fs from "fs";
import yaml from 'js-yaml';
import {Server} from 'socket.io';
import * as http from "http";

const PORT = 3099;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

io.on('connection', () => {
  console.log('Client connected to socket.io');
});

const doc = yaml.load(fs.readFileSync('sample_data/hello_world_game.yaml', 'utf8'));

app.get('/question/:id', (req, res) => {
  res.send(`This is question ${req.params.id}.`);
});

app.post('/question/:id', (req, res) => {
  res.status(501);
  res.send();
});

app.post('/game', (req, res) => {
  res.status(501);
  res.send();
});

server.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
