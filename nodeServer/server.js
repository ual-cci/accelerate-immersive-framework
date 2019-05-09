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
  console.log("STARTING SERVER")
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
  app.options("/*", function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.send(200);
  });


  let contentDBName = "";
  const contentCollectionName = config.contentCollectionName;
  const replicaSet = config.replicaSet;
  const mongoUser = config.mongoUser;
  const mongoPassword = config.mongoPassword;

  let mongoUri = "";
  if(process.env.NODE_ENV === "local" || process.env.NODE_ENV == "test")
  {
    contentDBName = process.env.NODE_ENV == "test" ? config.test_contentDBName:config.local_contentDBName;
    const mongoIP = config.local_mongoIP;
    const mongoPort = config.local_mongoPort;
    mongoUri = 'mongodb://' + mongoIP + ':' + mongoPort + '/' +contentDBName;
  }
  else if (process.env.NODE_ENV === "development")
  {
    contentDBName = config.development_contentDBName;
    const mongoIP = config.development_mongoIP;
    const mongoPort = config.development_mongoPort;
    const replicaSet = config.development_replicaSet;
    const mongoUser = config.development_mongoUser;
    const mongoPassword = config.development_mongoPassword;
    mongoUri = 'mongodb://' + mongoUser + ":" + mongoPassword + "@" +mongoIP + ':' + mongoPort + '/' +contentDBName;
    if(replicaSet)
    {
      mongoUri = mongoUri + '?replicaSet='+replicaSet;
    }
  }
  else if(process.env.NODE_ENV === "production")
  {
    contentDBName = config.production_contentDBName;
    const mongoIP = config.production_mongoIP;
    const mongoPort = config.production_mongoPort;
    const replicaSet = config.production_replicaSet;
    const mongoUser = config.production_mongoUser;
    const mongoPassword = config.production_mongoPassword;
    const ip1 = config.production_mongoIP1;
    const ip2 = config.production_mongoIP2;
    mongoUri = "mongodb://"+mongoUser+":"+mongoPassword+"@:"+ip1+"0"+ip2+mongoPort;
    mongoUri = mongoUri + "," + ip1 + "1" + ip2 + mongoPort + "," + ip1 + "2" + ip2 + mongoPort;
    mongoUri = mongoUri + "/" + contentDBName + "?ssl=true&replicaSet=" + replicaSet + "&authSource=admin&retryWrites=true";
  }

  config.mongoUri = mongoUri;
  config.mongoUri = "mongodb://MimicTestDBUser:w4tersmelly@mimicmini-shard-00-00-ytfc5.gcp.mongodb.net:27017,mimicmini-shard-00-01-ytfc5.gcp.mongodb.net:27017,mimicmini-shard-00-02-ytfc5.gcp.mongodb.net:27017/test?ssl=true&replicaSet=MimicMini-shard-0&authSource=admin&retryWrites=true";

  var server = http.createServer(app);
  const PORT = process.env.PORT || config.serverPort;
  server.listen(PORT);
  userAPI.initUserAPI(app, mongoUri);
  docAPI.initDocAPI(server, app, contentDBName, contentCollectionName, mongoUri);
  console.log('server set up');
}

module.exports = app; // for testing
