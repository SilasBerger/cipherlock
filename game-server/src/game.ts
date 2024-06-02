import {GameSpec} from "./model";

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

  /*
  - Count points per player
  - Store answer specs with questionIds
  - Have question checkers, associated with quesitonId
   */
  hasPlayerName(playerName: string) {
    return Object.values(this.players).some(player => player.name == playerName);
  }

  addPlayer(playerName: string): string {
    if (this.hasPlayerName(playerName)) {
      throw new Error(`Player name ${playerName} is already taken - should have checked for that beforehand.`);
    }

    const playerId = crypto.randomUUID();
    const player: Player = {
      id: playerId,
      name: playerName,
      points: 0,
    }

    return playerId;
  }
}
