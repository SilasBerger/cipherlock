import WebSocket, {WebSocketServer} from "ws";
import http from "http";
import * as stream from "node:stream";

export enum SocketEventType {
  UNLOCK = 'unlock',
}

export class SocketServer {

  private static _instance?: SocketServer = undefined;

  private readonly _clients: WebSocket[] = [];
  private readonly _webSocketServer: WebSocketServer;

  private constructor(private readonly _apiKey: string) {
    this._webSocketServer = new WebSocketServer({noServer: true});
  }

  static create(apiKey: string): SocketServer {
    if (SocketServer._instance) {
      throw new Error('An instance of SocketServer already exists');
    }

    const instance = new SocketServer(apiKey);

    instance._webSocketServer.on('connection', (ws) => {
      ws.on('error', console.error);

      ws.on('message', (data) => {
        console.log('received: %s', data);
      });

      ws.on('close', () => {
        const index = instance._clients.indexOf(ws);
        if (index > -1) {
          instance._clients.splice(index);
        }
        console.log(`WS disconnected. We have ${instance._clients.length} connections now.`);
      });
    });

    SocketServer._instance = instance;
    return instance;
  }

  async handleUpgrade(request: http.IncomingMessage, socket: stream.Duplex, head: Buffer) {
    if (!request.url) {
      this._declineUpgrade(socket, 'Missing url');
      return;
    }

    const url = new URL(request.url.startsWith('/') ? `ws://localhost${request.url}` : request.url);

    if (url.pathname !== '/ws') {
      console.log(`Refusing connection upgrade: invalid path (${url.pathname})`);
      this._declineUpgrade(socket, 'Invalid path');
      return;
    }

    const apiKey = url.searchParams?.get('apiKey');
    if (apiKey !== this._apiKey) {
      console.log(`Refusing connection upgrade: missing or invalid apiKey (${apiKey}).`);
      this._declineUpgrade(socket, 'Invalid API key');
      return;
    }

    this._webSocketServer.handleUpgrade(request, socket, head, (ws) => {
      this._clients.push(ws);
      console.log(`Registered WebSocket connection. We have ${this._clients.length} connections now.`);
      this._webSocketServer.emit('connection', ws, request);
    });
  }

  private _declineUpgrade(socket: any, message: string) {
    const responseHeaders = [
      'HTTP/1.1 400 Bad Request',
      'Connection: close',
      'Content-Type: text/plain',
      '\r\n'
    ].join('\r\n');

    socket.write(responseHeaders);
    socket.write(message);
    socket.destroy();
  }

  notifyClients(event: SocketEventType, data: any) {
    this._clients.forEach(client => {
      client.send(JSON.stringify({event, data}));
    })
  }
}