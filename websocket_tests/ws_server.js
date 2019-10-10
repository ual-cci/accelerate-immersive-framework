const WebSocket = require('ws');
const { Client } = require('node-osc');
const client = new Client('127.0.0.1', 6448);
const wss = new WebSocket.Server({port: 8080});

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('server received: %s', message);
    const vals = message.split(",");
    client.send('/wek/inputs', [0.1, 0.2], () => {

    });
  });
  ws.send('hello from server');
});
