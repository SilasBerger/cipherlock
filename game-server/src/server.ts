import express from 'express';
import * as fs from "fs";
import yaml from 'js-yaml';

const PORT = 3099;

const app = express();

const doc = yaml.load(fs.readFileSync('sample_data/hello_world_game.yaml', 'utf8'));
console.log(doc);

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`App listening on 0.0.0.0:${PORT}`);
})
