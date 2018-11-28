const mongo = require('mongodb');
var config = require('./config.js');
const mongoIP = config.mongoIP;
const mongoPort = config.mongoPort;
const contentDBName = config.contentDBName;
const contentCollectionName = config.contentCollectionName;
const replicaSet = config.replicaSet;
const oauthDBName = config.oauthDBName;

let docURI = 'mongodb://'+mongoIP+':'+mongoPort+'/'+contentDBName;
if(replicaSet)
{
  docURI = docURI + '?replicaSet='+replicaSet;
}
let userURI = 'mongodb://'+mongoIP+':'+mongoPort+'/'+oauthDBName;
if(replicaSet)
{
  userURI = userURI + '?replicaSet='+replicaSet;
}

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
