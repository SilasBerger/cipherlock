import {GameSpec} from "./model";
import * as crypto from "crypto";

interface Player {
  id: string;
  name: string;
  points: number;
}

export class Game {

  private players: { [key: string]: Player; } = {};

  constructor(private _gameSpec: GameSpec) {

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
    return Object.values(this.players).some(player => player.name == playerName);
  }

  addPlayer(playerName: string): string {
    if (this.hasPlayerName(playerName)) {
      throw new Error(`Player name ${playerName} is already taken - should have checked for that beforehand.`);
    }

    const playerId = crypto.randomUUID();
    this.players[playerId] = {
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
    return Object.keys(this.players).includes(playerId);
  }
}
