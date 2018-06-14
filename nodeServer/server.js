var http = require('http');
var express = require('express');
var userAPI = require('./user-model.js');
var docAPI = require('./document-model.js');
var guid = require('./uuid.js');
var cors = require('express-cors');
var config = require('./config.js');

const app = express();

startServer();

function startServer()
{
  app.use(express.static('static'));
  app.use(cors({
    allowedOrigins: [
        'http://'+ config.emberIP + ':'+ config.emberPort
    ],
    headers: ["Authorization", "Content-Type"]
  }));

  var server = http.createServer(app);
  server.listen(config.serverPort);
  userAPI.initUserAPI(app, config);
  docAPI.initDocAPI(server, app, config);
  userAPI.initErrorHandling(app);
  console.log('Listening on http://'+ config.serverIP + ':'+ config.serverPort);
}
