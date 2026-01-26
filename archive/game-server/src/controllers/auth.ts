import {RequestHandler} from "express";
import {Engine} from "../core/engine";
import {
  CheckInRequest,
  CheckInResponse,
  OnboardingErrorResponse,
  OnboardingRequest,
  OnboardingSuccessResponse
} from "../models/api";

export const onboard: RequestHandler<any, any, OnboardingRequest> = async (req, res, next) => {
  const onboardingRequest = req.body;
  const activeGame = Engine.instance.activeGame;

  const playerName = onboardingRequest.playerName;
  const gameIdValid = activeGame?.gameId === onboardingRequest.gameId;
  const playerNameAvailable = !activeGame?.hasPlayerName(playerName);
  const playerNameValid = playerName.length >= 3 && playerName.length < 15;
  if (!activeGame || !gameIdValid || !playerNameAvailable || !playerNameValid) {
    res.status(409);
    res.json({
      gameActive: Engine.instance.isGameActive,
      gameIdValid: gameIdValid,
      playerNameAvailable: playerNameAvailable,
      playerNameValid: playerNameValid,
    } as OnboardingErrorResponse);
    return;
  }

  const playerId = activeGame!.addPlayer(playerName);

  res.status(200);
  res.json({
    playerId: playerId,
  } as OnboardingSuccessResponse);
}

export const checkIn: RequestHandler<any, any, CheckInRequest> = async (req, res, next) => {
  const checkInRequest = req.body;
  const activeGame = Engine.instance.activeGame;

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
}