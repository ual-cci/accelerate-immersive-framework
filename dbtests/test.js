const mongo = require('mongodb');
var config = require('../nodeServer/config.js');
const mongoIP = config.mongoIP;
const mongoPort = config.mongoPort;
const contentDBName = config.contentDBName;
const contentCollectionName = config.contentCollectionName;
const replicaSet = config.replicaSet;
const oauthDBName = config.oauthDBName;
const docURI = 'mongodb://'+mongoIP+':'+mongoPort+'/'+contentDBName;
const userURI = 'mongodb://'+mongoIP+':'+mongoPort+'/'+oauthDBName;

let docDB;
mongo.MongoClient.connect(docURI, function(err, client) {
  if(err)
  {
    console.log("DOCUMENT MODEL - error connecting to database", err);
  }
  else
  {
    console.log("Connected successfully to server");
    docDB = client.db(contentDBName);

  }
});

let userDB;
mongo.MongoClient.connect(userURI, function(err, client) {
  if(err)
  {
    console.log("DOCUMENT MODEL - error connecting to database", err);
  }
  else
  {
    console.log("Connected successfully to server");
    userDB = client.db(contentDBName);
  }
});
