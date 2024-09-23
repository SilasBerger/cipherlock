import {RequestHandler} from "express";
import {GameSpec} from "../model";
import {Engine} from "../core/engine";

export const loadGame: RequestHandler<any, any, GameSpec> = async (req, res, next) => {
  if (!req.is('application/json')) {
    res.status(400);
    res.send('Bad type: Payload must be application/json.');
    return;
  }

  Engine.instance.updateGameSpec(req.body);

  res.status(204);
  res.send();
}