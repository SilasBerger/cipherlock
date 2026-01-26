import {RequestHandler} from "express";
import {Engine} from "../core/engine";
import {SocketEventType} from "../socket";
import {AnswerCheckErrorResponse, AnswerCheckRequest} from "../models/api";

export const checkAnswer: RequestHandler<any, any, AnswerCheckRequest> = async (req, res, next) => {
  const activeGame = Engine.instance.activeGame;

  if (!activeGame) {
    res.status(409);
    res.send('No game active.');
    return;
  }

  const answerCheckRequest = req.body;

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
    Engine.instance.socketServer.notifyClients(SocketEventType.UNLOCK, {
      lockboxId: activeGame?.getLockboxIdFor(questionId)
    });
  }

  res.status(200);
  res.json(result);
}