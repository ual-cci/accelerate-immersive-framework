var http = require('http');
var express = require('express');
var userAPI = require('./user-model.js');
var docAPI = require('./document-model.js');
var guid = require('./uuid.js');
var cors = require('express-cors');

var bodyParser = require('body-parser');
const app = express();

startServer();

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

function startServer()
{
  console.log("STARTING SERVER")
  app.use('/ccAsset', bodyParser.raw({type: '*/*',limit: '100mb'}));
  app.use('/source', bodyParser.raw({type: '*/*',limit: '100mb'}));
  app.use('/asset/:docid/:filename', bodyParser.raw({type: '*/*',limit: '100mb'}));
  app.use(express.json({limit: '100mb'}));
  app.use(express.urlencoded({extended: true, limit: '100mb'}));
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

  var config = {};

  try {
    config = require('./config.js');
  } catch {
    console.log("no config file")
  }

  let contentDBName = config.contentDBName || "cc3_dev_content";
  let oauthDBName = config.oauthDBName || "cc3_dev_oauth";
  const contentCollectionName = config.contentCollectionName || "docs";
  const replicaSet = config.replicaSet;
  const mongoUser = config.mongoUser;
  const mongoPassword = config.mongoPassword;

  let redis;
  var environment = process.env.NODE_ENV
  console.log("NODE_ENV", environment)
  if(environment === "local" || environment == "test")
  {
    console.log("setting local/test env");
    contentDBName = process.env.NODE_ENV == "test" ? config.test_contentDBName:contentDBName;
    oauthDBName = process.env.NODE_ENV == "test" ? config.test_oauthDBName:oauthDBName;
    const mongoIP = config.local_mongoIP;
    const mongoPort = config.local_mongoPort;
    mongoContentUri = 'mongodb://' + mongoIP + ':' + mongoPort + '/' +contentDBName;
    mongoUserUri = 'mongodb://' + mongoIP + ':' + mongoPort + '/' +oauthDBName;
  }
  else if (environment === "development")
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
  else if(environment === "heroku")
  {
    console.log("setting heroku env");

    const mongoUser = process.env.heroku_mongoUser || config.heroku_mongoUser;
    const mongoPassword = process.env.heroku_mongoPassword || config.heroku_mongoPassword;
    let uri = "mongodb+srv://"+mongoUser+":"+mongoPassword+"@cluster0.rvdi2.mongodb.net/"
    mongoContentUri = uri+contentDBName;
    mongoUserUri = uri+oauthDBName;
    console.log(mongoContentUri, mongoUserUri)

  }
  else if(environment === "production")
  {
    console.log("setting production env");
    const mongoIP =  process.env.production_mongoIP || config.production_mongoIP;
    const mongoPort = process.env.production_mongoPort || config.production_mongoPort;
    const replicaSet = process.env.production_replicaSet || config.production_replicaSet;
    const mongoUser = process.env.production_mongoUser ||config.production_mongoUser;
    const mongoPassword = process.env.production_mongoPassword || config.production_mongoPassword;
    const ip1 = process.env.production_mongoIP1 || config.production_mongoIP1;
    const ip2 = process.env.production_mongoIP2 || config.production_mongoIP2;
    let uri = "mongodb://"+mongoUser+":"+mongoPassword+"@"+ip1+"0"+ip2+mongoPort;
    uri = uri + "," + ip1 + "1" + ip2 + mongoPort + "," + ip1 + "2" + ip2 + mongoPort;
    mongoContentUri = uri + "/" + contentDBName + "?ssl=true&replicaSet=" + replicaSet + "&authSource=admin&retryWrites=true";
    mongoUserUri = uri + "/" + oauthDBName + "?ssl=true&replicaSet=" + replicaSet + "&authSource=admin&retryWrites=true";

  }

  var server = http.createServer(app);
  const PORT = process.env.PORT || config.serverPort;
  server.listen(PORT);
  userAPI.initUserAPI(app, mongoUserUri);

  docAPI.initDocAPI(
    server, app,
    contentDBName, contentCollectionName, mongoContentUri,
    redis
  );
  console.log('server set up', PORT);
}

module.exports = app; // for testing
