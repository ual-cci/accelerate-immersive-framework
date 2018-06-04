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
var guid = require('./uuid.js');

const db = require('sharedb-mongo')('mongodb://localhost:27017/test');
const backend = new ShareDB({db:db});
const connection = backend.connect();
const app = express();
const collectionName = 'mimicDocs'

startServer();

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
    userAPI.init();
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

  app.post('/resetPassword', function(req,res) {
    console.log(req.body);
    userAPI.requestPasswordReset(req.body.username)
    .then( () => {
      console.log('success reset');
      res.sendStatus(200)
    })
    .catch( (err) =>  {
      console.log('failed reset');
      res.status(400).send(err)});
  });

  app.post('/checkPasswordToken', function(req,res) {
    console.log(req.body);
    userAPI.checkPasswordToken(req.body.username, req.body.token)
    .then( () => {
      console.log('token good');
      res.sendStatus(200);
    })
    .catch( (err) =>  {
      console.log('token bad');
      res.status(400).send(err);
    });
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
  app.get('/documents', (req,res) => {
    let query = connection.createFetchQuery(collectionName,{},[],(err, results) => {
      if(!err)
      {
        let docs = [];
        for(var i = 0; i < results.length; i++) {
          docs.push({attributes:results[i].data,id:results[i].data.documentId,type:"document"});
        }
        res.status(200).send({data:docs});
      }
      else
      {
        res.status(400).send(err);
      }
    });
  });

  app.post('/documents', (req,res) => {
    let attr = req.body.data.attributes;
    console.log(attr);
    createDoc(attr.name, attr.owner, attr.public ? "false":"true")
    .then( function(doc){
      res.type('application/vnd.api+json');
      res.status(200);
      var json = {
        data:{
          id:doc.data.documentId,
          type:'document',
          attr:doc.data
        }
      }
      res.json(json);
    },
     function(err) {
       res.type('application/vnd.api+json');
       res.status(code);
       res.json({errors:[err]});
     });
  });
}

function getNewDocumentId(callback)
{
  const uuid = guid.guid();
  var doc = connection.get(collectionName, uuid);
  doc.fetch(function(err) {
    if (doc.type === null) {
      return callback(uuid);
    }
    else {
      getNewDocumentId(callback);
    }
  });
}

function createDoc(docName,owner,isPrivate) {
  return new Promise((resolve, reject) => {
    console.log("creating doc");
    getNewDocumentId(function(uuid) {
      var doc = connection.get(collectionName, uuid);
      doc.fetch(function(err) {
        if (err) {
          console.log("database error making document");
          reject("database error making document");
          return;
        }
        if (doc.type === null) {
          doc.create({
            source:"",
            owner:owner,
            isPrivate:isPrivate,
            name:docName,
            documentId:uuid
          },resolve);
          console.log("doc created");
          resolve(doc);
          return;
        }
        console.log("document with that name alrady exists");
        reject("document with that name alrady exists");
        return;
      });
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
