import {
  Answer,
  AnswerCheckResult,
  AnswerDefinition,
  AnswerType,
  GameSpec,
  SingleChoiceAnswerSpec, SingleChoiceAnswer,
  TextAnswerSpec, TextAnswer
} from "./model";
import * as crypto from "crypto";
import {checkSingleChoiceAnswer, checkTextAnswer} from "./answer-checker";

interface Player {
  id: string;
  name: string;
  points: number;
}

export class Game {

  private readonly _players: { [key: string]: Player; } = {};
  private readonly _answerDefinitions: { [key: string]: AnswerDefinition; } = {};

  constructor(private _gameSpec: GameSpec) {
    _gameSpec.caches.forEach(cache => {
      this._answerDefinitions[cache.questionId] = cache.answer;
    });
  }

  get gameId(): string {
    return this._gameSpec.gameId;
  }

  get requiresKnownPlayers(): boolean {
    return this._gameSpec.requireKnownPlayers;
  }

  hasPlayerName(playerName: string) {
    if (!playerName) {
      return false;
    }
    return Object.values(this._players).some(player => player.name == playerName);
  }

  addPlayer(playerName: string): string {
    if (this.hasPlayerName(playerName)) {
      throw new Error(`Player name ${playerName} is already taken - should have checked for that beforehand.`);
    }

    const playerId = crypto.randomUUID();
    this._players[playerId] = {
      id: playerId,
      name: playerName,
      points: 0,
    };

    return playerId;
  }

  hasPlayerId(playerId?: string) {
    if (!playerId) {
      return false;
    }
    return Object.keys(this._players).includes(playerId);
  }

  hasQuestion(questionId: string): boolean {
    if (!questionId) {
      return false;
    }

    return Object.keys(this._answerDefinitions).includes(questionId);
  }

  getLockboxIdFor(questionId: string) {
    const lockboxId = this._gameSpec.caches.find((cache) => cache.questionId === questionId)?.lockboxId;
    if (!lockboxId) {
      throw new Error(`No lockbox associated with questionId ${questionId}. This should have been checked beforehand.`);
    }
    return lockboxId;
  }

  checkAnswer(questionId: string, answer: Answer): AnswerCheckResult {
    if (!this.hasQuestion(questionId)) {
      throw new Error(`No answer definition for questionId ${questionId}. This should have been checked beforehand.`);
    }

    const answerDefinition = this._answerDefinitions[questionId];
    switch (answerDefinition.type) {
      case AnswerType.TextAnswer:
        return checkTextAnswer(answerDefinition.spec as TextAnswerSpec, answer as TextAnswer);
      case AnswerType.SingleChoice:
        return checkSingleChoiceAnswer(answerDefinition.spec as SingleChoiceAnswerSpec, answer as SingleChoiceAnswer);
    }
  }
}
