import {Game} from "./game/game";
import {BehaviorSubject, Observable, tap} from "rxjs";
import {GameSpec} from "../model";
import {SocketServer} from "../socket";

export class Engine {

  private static _instance?: Engine = undefined;

  private readonly _$gameSpec = new BehaviorSubject<GameSpec | null>(null);
  private _activeGame: Game | null = null;

  private constructor(private readonly _socketServer: SocketServer) {}

  static setup(socketServer: SocketServer) {
    const instance = new Engine(socketServer);

    instance._$gameSpec.pipe(
      tap(spec => {
        if (!!spec) {
          instance._activeGame = new Game(spec);
        } else {
          instance._activeGame = null;
        }
      }),
    ).subscribe();

    Engine._instance = instance;
  }

  static get instance(): Engine {
    if (!Engine._instance) {
      throw new Error('Engine instance queried before setup');
    }
    return Engine._instance;
  }

  get activeGame(): Game | null {
    return this._activeGame;
  }

  get isGameActive(): boolean {
    return !!this._activeGame;
  }

  get socketServer() {
    return this._socketServer;
  }

  updateGameSpec(spec: GameSpec) {
    this._$gameSpec.next(spec);
  }
}