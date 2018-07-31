const WebSocket = require('ws');

//const ws = new WebSocket('ws://172.16.101.238:8080');
//const ws = new WebSocket('wss://dev.codecircle.gold.ac.uk/api');
const ws = new WebSocket('ws://localhost:8080');

ws.on('error', function(err) {
  console.log('error:',err);
});
ws.on('open', function open() {
  ws.send('hello from client');
});

ws.on('message', function incoming(data) {
  console.log("rec from server: "+data);
});
