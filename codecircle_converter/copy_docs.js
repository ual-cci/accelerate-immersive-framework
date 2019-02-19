const mongo = require('mongodb');
var cc_mongoIP = "127.0.0.1";
var cc_mongoPort = "27017";
var cc_contentDBName = "cc2_live";
var mimicURL = "https://www.dev.codecircle.gold.ac.uk/api/"
var cc_mongoUri = 'mongodb://'+cc_mongoIP+':'+cc_mongoPort+'/'+cc_contentDBName;
const Gridfs = require('gridfs-stream');
let gridFS;

mongo.MongoClient.connect(cc_mongoUri, function(err, client) {
  if(err)
  {
    console.log("DOCUMENT MODEL - error connecting to database", err);
  }
  else
  {
    console.log("Connected successfully to server");
    const db = client.db(cc_contentDBName);
    let userCollection = "documents"
    let query = {username:"mickster"}
    db.collection(userCollection).find(query).toArray(function(err, result) {
      if (err) throw err;
      console.log(result);
      //client.close();
    });
    gridFS = Gridfs(db, mongo);
  }
});
