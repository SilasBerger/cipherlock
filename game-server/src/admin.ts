import {Observable, tap} from "rxjs";
import {Socket} from "socket.io";
import {GameSpec} from "./models/game";

export class AdminObserver {
  constructor(private _socket: Socket, $gameSpec: Observable<GameSpec | null>) {
    this._subscribeToGameSpec($gameSpec);
  }

  _subscribeToGameSpec($gameSpec: Observable<GameSpec | null>) {
    $gameSpec.pipe(
      tap(spec => this._socket.emit('gameSpecUpdated', spec)),
    ).subscribe();
  }
}
