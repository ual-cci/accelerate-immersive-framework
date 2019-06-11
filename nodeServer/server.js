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
  	res.header('Access-Control-Allow-Origin', '*');
  	res.header('Access-Control-Allow-Credentials', 'true');
  	res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  	res.header('Access-Control-Expose-Headers', 'Content-Length');
  	res.header('Access-Control-Allow-Headers', 'Origin, Accept, Authorization, Content-Type, X-Requested-With, Range');
  	if (req.method === 'OPTIONS') {
  	    return res.sendStatus(200);
    } else {
        return next();
    }
  });
  app.options("/*", function(req, res, next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    res.send(200);
  });

  let contentDBName = config.contentDBName;
  let oauthDBName = config.oauthDBName;
  const contentCollectionName = config.contentCollectionName;
  const replicaSet = config.replicaSet;
  const mongoUser = config.mongoUser;
  const mongoPassword = config.mongoPassword;

  let mongoContentUri = "";
  let mongoUserUri = "";
  console.log("NODE_ENV", process.env.NODE_ENV)
  if(process.env.NODE_ENV === "local" || process.env.NODE_ENV == "test")
  {
    console.log("setting local/test env");
    contentDBName = process.env.NODE_ENV == "test" ? config.test_contentDBName:contentDBName;
    oauthDBName = process.env.NODE_ENV == "test" ? config.test_oauthDBName:oauthDBName;
    const mongoIP = config.local_mongoIP;
    const mongoPort = config.local_mongoPort;
    mongoContentUri = 'mongodb://' + mongoIP + ':' + mongoPort + '/' +contentDBName;
    mongoUserUri = 'mongodb://' + mongoIP + ':' + mongoPort + '/' +oauthDBName;
  }
  else if (process.env.NODE_ENV === "development")
  {
    console.log("setting development env");
    const mongoIP = config.development_mongoIP;
    const mongoPort = config.development_mongoPort;
    const replicaSet = config.development_replicaSet;
    const mongoUser = config.development_mongoUser;
    const mongoPassword = config.development_mongoPassword;
    let uri = 'mongodb://' + mongoUser + ":" + mongoPassword + "@" +mongoIP + ':' + mongoPort + "/";
    mongoContentUri = uri + contentDBName;
    mongoUserUri = uri + oauthDBName;
    if(replicaSet)
    {
      mongoContentUri = mongoContentUri + '?replicaSet='+replicaSet;
      mongoUserUri = mongoUserUri + '?replicaSet='+replicaSet;
    }
    console.log(mongoContentUri, mongoUserUri)
  }
  else if(process.env.NODE_ENV === "production")
  {
    console.log("setting production env");
    const mongoIP = config.production_mongoIP;
    const mongoPort = config.production_mongoPort;
    const replicaSet = config.production_replicaSet;
    const mongoUser = config.production_mongoUser;
    const mongoPassword = config.production_mongoPassword;
    const ip1 = config.production_mongoIP1;
    const ip2 = config.production_mongoIP2;
    let uri = "mongodb://"+mongoUser+":"+mongoPassword+"@"+ip1+"0"+ip2+mongoPort;
    uri = uri + "," + ip1 + "1" + ip2 + mongoPort + "," + ip1 + "2" + ip2 + mongoPort;
    mongoContentUri = uri + "/" + contentDBName + "?ssl=true&replicaSet=" + replicaSet + "&authSource=admin&retryWrites=true";
    mongoUserUri = uri + "/" + oauthDBName + "?ssl=true&replicaSet=" + replicaSet + "&authSource=admin&retryWrites=true";
  }

  var server = http.createServer(app);
  const PORT = process.env.PORT || config.serverPort;
  server.listen(PORT);
  userAPI.initUserAPI(app, mongoUserUri);
  docAPI.initDocAPI(server, app, contentDBName, contentCollectionName, mongoContentUri);
  console.log('server set up');
}

module.exports = app; // for testing
