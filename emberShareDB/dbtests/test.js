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
    var myquery = {ownerId: {$exist:false}};
    var newvalues = {$set: {owner: "louis-id", ownerId:"b3d087be-566b-21f6-bf8d-3b2f89a2165a"} };
    docDB.collection("docs").updateMany(myquery, newvalues, function(err, res) {
      if (err) throw err;
        console.log(res.result.nModified + " document(s) updated");
    });
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
    userDB = client.db(oauthDBName);
    userDB.collection("users").find({}).toArray(function(err, result) {
      if (err) throw err;
        console.log(result);
    });
  }
});
