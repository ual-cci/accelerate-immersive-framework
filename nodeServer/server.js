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
const connection = backend.connect();
const app = express();
startServer();
const collectionName = 'MIMIC'

function startAuthAPI()
{
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
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
    //console.log('request for new user', req.body);
    let attr = req.body.data.attributes;
    console.log(attr);
    userAPI.newUser(attr.username,attr.password,attr.email)
    .then( () => res.sendStatus(200))
    .catch( (err) =>  res.status(400).send(err));
  });
}

function startWS(server)
{
  // Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({server: server});
  wss.on('connection', (ws, req) => {
    var stream = new WebSocketJSONStream(ws);
    ws.on('message', function incoming(data) {
      console.log('server weboscket message',data);
    });
    console.log('WebSocket connection');
    backend.listen(stream);
  });
}

function startDocAPI()
{
  app.get('/code-documents', (req,res) => {
    let attr = req.body.data.attributes;
    console.log(attr);
  });
  app.post('/code-documents', (req,res) => {
    let attr = req.body.data.attributes;
    console.log(attr);
    createDoc(attr.name)
    .then( (doc) => res.status(200).end())
    .catch( (err) =>  res.status(400).send({errors:[err]}));
  });
}

function createDoc(docName) {
  return new Promise((resolve, reject) => {
    var doc = connection.get(collectionName, docName);
    doc.fetch(function(err) {
      if (err) {
        reject(err);
        return;
      }
      if (doc.type === null) {
        doc.create('',resolve);
        console.log("doc created");
        resolve(doc);
        return;
      }
      console.log("doc fetched", doc.id, doc.data);
      resolve(doc);
      return;
    });
  });
}

function startServer()
{
  app.use(express.static('static'));
  app.use(cors({
    allowedOrigins: [
        'http://localhost:4200'
    ],
    headers: ["Authorization", "Content-Type"]
  }));

  var server = http.createServer(app);

  startWS(server);
  startAuthAPI();
  startDocAPI();

  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
