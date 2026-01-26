import {Cache} from "./caches";

export interface GameSpec {
  gameId: string;
  gameDescription: string;
  requireKnownPlayers: boolean;
  caches: Cache[];
}