var http = require('http');
var express = require('express');
var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');

const db = require('sharedb-mongo')('mongodb://localhost:27017/test');
const backend = new ShareDB({db:db});
createDoc(startServer);

// Create initial document then fire callback
function createDoc(callback) {
  var connection = backend.connect();
  var doc = connection.get('MIMIC', 'text-area');
  console.log("fetching doc");
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create('', callback);
      console.log("doc created");
      return;
    }
    console.log("doc fetched", doc.id, doc.data);
    callback();
  });
}

function startServer() {
  // Create a web server to serve files and listen to WebSocket connections
  var app = express();
  app.use(express.static('static'));
  var server = http.createServer(app);

  // Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({server: server});
  wss.on('connection', function(ws, req) {
    var stream = new WebSocketJSONStream(ws);
    ws.on('message', function incoming(data) {
      console.log('server weboscket message',data);
    });
    console.log('WebSocket connection');
    backend.listen(stream);
  });


  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
