import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';

import http from 'http';
import WebSocket from 'ws';

interface Msg {
  type: string;
  message: string;
  userName?: string;
}

class CustomWebSocket extends WebSocket {
  nickName?: string;
}

const app: Application = express();
const PORT = 3030;

const server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

server.listen(PORT, (): void => {
  console.log(`Connected successfully on port ${PORT}`);
});

const webSocketServer: WebSocket.Server = new WebSocket.Server({ server: server });

const sockets: CustomWebSocket[] = [];

webSocketServer.on('connection', (webSocket: CustomWebSocket): void => {
  console.log(`클라이언트 접속 완료, 현재 접속자 수 : ${sockets.length + 1}`);

  sockets.forEach((socket: CustomWebSocket): void => {
    socket.send(
      JSON.stringify({ type: 'liveCount', message: '새로운 사용자가 접속했습니다.', count: sockets.length + 1 }),
    );
  });

  webSocket['nickName'] = '익명';
  sockets.push(webSocket);

  webSocket.on('message', (message): void => {
    const messageObject: Msg = JSON.parse(message.toString());
    console.log(
      `클라이언트로부터 메시지 수신: ${messageObject.userName}, ${messageObject.type}, ${messageObject.message}`,
    );

    switch (messageObject.type) {
      case 'nickName':
        webSocket['nickName'] = messageObject.message;
        break;
      case 'chat':
        sockets.forEach((socket: CustomWebSocket): void => {
          const msg = {
            type: 'chat',
            userName: messageObject.userName,
            message: messageObject.message,
          };
          socket.send(JSON.stringify(msg));
        });
        break;
      case 'checkCount':
        webSocket.send(
          JSON.stringify({ type: 'liveCount', message: '새로운 사용자가 접속했습니다.', count: sockets.length + 1 }),
        );
        break;
    }
  });

  webSocket.on('close', (): void => {
    console.log('클라이언트 접속 해제');
    sockets.splice(sockets.indexOf(webSocket), 1);
  });

  webSocket.on('error', (error: Error): void => {
    console.log(`에러 발생: ${error.message}`);
  });
});
