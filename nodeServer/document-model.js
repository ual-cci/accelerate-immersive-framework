var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var mongoose = require('mongoose');
var multiparty = require('connect-multiparty')();
var fs = require('fs');
var Gridfs = require('gridfs-stream');
var guid = require('./uuid.js');
var userAPI = require('./user-model.js');

const collectionName = 'mimicDocs'
const shareDBMongo = require('sharedb-mongo')('mongodb://localhost:27017/mimicDocs');
const shareDB = new ShareDB({db:shareDBMongo});
const shareDBConnection = shareDB.connect();

var initDocAPI = function(server, app)
{
  startDocAPI(app);
  startWS(server);
  startFSAPI(app);
}

function startFSAPI(app)
{
  const gridFSDB = mongoose.connection.db;
  const gridFSDriver = mongoose.mongo;
  const gridFS = new Gridfs(gridFSDB, gridFSDriver);

  app.post('/asset', multiparty, function(req,res) {
    console.log(req.body,req.files);

    var writestream = gridFS.createWriteStream({
      filename: req.files.file.name,
      mode: 'w',
      content_type: req.files.file.mimetype,
      metadata: req.body
    });

    fs.createReadStream(req.files.file.path).pipe(writestream);
    writestream.on('close', function(file) {
      res.json(200);
      let doc = shareDBConnection.get(collectionName,req.body.documentId)
      console.log(doc);
      var newAssets = doc.data.assets;
      newAssets.push({'name':req.files.file.name,"fileId":file._id});
      console.log(newAssets);
      doc.submitOp({p:['assets'],oi:newAssets});
      fs.unlink(req.files.file.path, function(err) {
         console.log('success!')
       });
    });
  });

  app.get('/asset/:id', function(req, res) {
   var readstream = gridFS.createReadStream({
      _id: req.params.id
   });
   readstream.pipe(res);
});
}

function startWS(server)
{
  // Connect any incoming WebSocket connection to ShareDB
  var wss = new WebSocket.Server({server: server});
  wss.on('connection', (ws, req) => {
    var stream = new WebSocketJSONStream(ws);
    ws.on('message', function incoming(data) {
      console.log('server weboscket message',data);
    });
    console.log('WebSocket connection');
    shareDB.listen(stream);
  });
}

function startDocAPI(app)
{
  app.get('/documents', (req,res) => {
    let query = shareDBConnection.createFetchQuery(collectionName,{},[],(err, results) => {
      if(!err)
      {
        let docs = [];
        for(var i = 0; i < results.length; i++) {
          docs.push({attributes:results[i].data,id:results[i].data.documentId,type:"document"});
        }
        res.status(200).send({data:docs});
      }
      else
      {
        res.status(400).send(err);
      }
    });
  });

  app.post('/documents', (req,res) => {
    let attr = req.body.data.attributes;
    console.log(attr);
    createDoc(attr.name, attr.owner, attr.public ? "false":"true")
    .then( function(doc){
      res.type('application/vnd.api+json');
      res.status(200);
      var json = {data:{id:doc.data.documentId,type:'document',attr:doc.data}};
      res.json(json);
    },
     function(err) {
       res.type('application/vnd.api+json');
       res.status(code);
       res.json({errors:[err]});
     });
  });
}

function getNewDocumentId(callback)
{
  const uuid = guid.guid();
  var doc = shareDBConnection.get(collectionName, uuid);
  doc.fetch(function(err) {
    if (doc.type === null) {
      return callback(uuid);
    }
    else {
      getNewDocumentId(callback);
    }
  });
}

function createDoc(docName,owner,isPrivate) {
  return new Promise((resolve, reject) => {
    console.log("creating doc");
    getNewDocumentId(function(uuid) {
      var doc = shareDBConnection.get(collectionName, uuid);
      doc.fetch(function(err) {
        if (err) {
          console.log("database error making document");
          reject("database error making document");
          return;
        }
        if (doc.type === null) {
          doc.create({
            source:"",
            owner:owner,
            isPrivate:isPrivate,
            name:docName,
            documentId:uuid,
            created:new Date(),
            lastEdited:new Date(),
            assets:[]
          },resolve);
          console.log("doc created");
          resolve(doc);
          return;
        }
        console.log("document with that name alrady exists");
        reject("document with that name alrady exists");
        return;
      });
    });
  });
}

module.exports = {
  initDocAPI:initDocAPI
}
