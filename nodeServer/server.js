var http = require('http');
var express = require('express');
var userAPI = require('./user-model.js');
var docAPI = require('./document-model.js');
var guid = require('./uuid.js');
var cors = require('express-cors');
var config = require('./config.js');

const app = express();

startServer();

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

function startServer()
{
  app.use(express.static('static'));
  app.use(express.json({limit: '50mb'}));
  app.use(express.urlencoded({extended: true, limit: '50mb'}));
  app.use(function(req, res, next) {
  	res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  	res.header('Access-Control-Allow-Credentials', 'true');
  	res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  	res.header('Access-Control-Expose-Headers', 'Content-Length');
  	res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  	if (req.method === 'OPTIONS') {
  	    return res.sendStatus(200);
    } else {
        return next();
    }
  });

  var server = http.createServer(app);
  server.listen(config.serverPort);
  userAPI.initUserAPI(app, config);
  docAPI.initDocAPI(server, app, config);
  console.log('Listening on http://'+ config.serverIP + ':'+ config.serverPort);
}
