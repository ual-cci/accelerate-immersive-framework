var http = require('http');
var express = require('express');
var userAPI = require('./user-model.js');
var docAPI = require('./document-model.js');
var guid = require('./uuid.js');
var cors = require('express-cors');

const app = express();
startServer();

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
  server.listen(8080);
  userAPI.initUserAPI(app);
  docAPI.initDocAPI(server, app);
  userAPI.initErrorHandling(app);
  console.log('Listening on http://localhost:8080');
}
