var http = require('http');
var express = require('express');
var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var bodyParser = require('body-parser');
var oauthserver = require('oauth2-server');
var mongoose = require('mongoose');
var cors = require('express-cors');
var userAPI = require('./user-model.js');

const db = require('sharedb-mongo')('mongodb://localhost:27017/test');
const backend = new ShareDB({db:db});
const app = express();
startServer();

function createDoc(callback) {
  var connection = backend.connect();
  var doc = connection.get('MIMIC-2', 'text-area');
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

function startAuth()
{
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  var mongoUri = 'mongodb://localhost/oauth';
  mongoose.connect(mongoUri, function(err, res) {
    if (err) {
      return console.error('Error connecting to "%s":', mongoUri, err);
    }
    console.log('Connected successfully to "%s"', mongoUri);
  });

  app.oauth = oauthserver({
    model: userAPI,
    grants: ['password'],
    debug: true
  });

  app.all('/oauth/token', app.oauth.grant());

  app.get('/', app.oauth.authorise(), function (req, res) {
    res.send('Congratulations, you are in a secret area!');
  });

  app.use(app.oauth.errorHandler());

  app.post('/accounts', function (req, res) {
    console.log('request for new user');
    userAPI.newUser("test","test",function(){},function(){});
    res.sendStatus(200);
  })
}

function startWS(server)
{
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
}

function startServer() {
  // Create a web server to serve files and listen to WebSocket connections
  app.use(express.static('static'));
  app.use(cors({
    allowedOrigins: [
        'http://localhost:4200'
    ],
    headers: ["Authorization", "Content-Type"]
  }));

  var server = http.createServer(app);

  startWS(server);
  startAuth();

  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
