var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var multiparty = require('connect-multiparty')();
var fs = require('fs');
var Gridfs = require('gridfs-stream');
var guid = require('./uuid.js');
var userAPI = require('./user-model.js');
var mongoIP = "";
var mongoPort = "";
var contentDBName = "";
var contentCollectionName = "";
var shareDBMongo;
var shareDB;
var shareDBConnection;

var initDocAPI = function(server, app, config)
{
  mongoIP = config.mongoIP;
  mongoPort = config.mongoPort;
  contentDBName = config.contentDBName;
  contentCollectionName = config.contentCollectionName;
  shareDBMongo = require('sharedb-mongo')('mongodb://'+mongoIP+':'+mongoPort+'/'+contentDBName);
  shareDB = new ShareDB({db:shareDBMongo});
  shareDBConnection = shareDB.connect();

  startDocAPI(app);
  startWebSockets(server);
  startAssetAPI(app);
}

// ENDPOINTS

function handleError(err)
{
  console.log("error:"+err);
}

function startAssetAPI(app)
{
  var db = new mongo.Db(contentDBName, new mongo.Server(mongoIP, mongoPort));
  db.open(function (err) {
    if (err) return handleError(err);
    const gridFS = Gridfs(db, mongo);
    console.log('connection opened to ' + contentDBName);

    app.post('/asset', multiparty, function(req,res) {
      var writestream = gridFS.createWriteStream({
        filename: req.files.file.name,
        mode: 'w',
        content_type: req.files.file.mimetype,
        metadata: req.body
      });

      fs.createReadStream(req.files.file.path).pipe(writestream);
      writestream.on('close', function(file) {
        res.json(200);
        const content_type = req.files.file.headers["content-type"];
        console.log("UPLOADED FILE OF TYPE:",content_type);
        let doc = shareDBConnection.get(contentCollectionName,req.body.documentId)
        var newAssets = doc.data.assets;
        newAssets.push({'name':req.files.file.name,"fileId":file._id,fileType:content_type});
        console.log(newAssets);
        doc.submitOp({p:['assets'],oi:newAssets},{source:'server'});
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

    app.delete('/asset/:id', function(req, res) {
      gridFS.remove({_id:req.params.id}, function (err, gridFSDB) {
        if (err) return handleError(err);
        console.log('success deleting asset');
        let doc = shareDBConnection.get(contentCollectionName,req.body.documentId)
        console.log(doc);
        var newAssets = doc.data.assets;
        newAssets = newAssets.filter(function( asset ) {
            return asset.fileId !== req.params.id;
        });
        console.log(newAssets);
        doc.submitOp({
          p:['assets'],oi:newAssets},{source:'server'});
        res.json(200);
      });
    });
  });
}

function startWebSockets(server)
{
  var wss = new WebSocket.Server({server: server});
  wss.on('connection', (ws, req) => {
    var stream = new WebSocketJSONStream(ws);
    ws.on('message', function incoming(data) {
      console.log('server weboscket message',data);
    });
    shareDB.listen(stream);
  });
}

function startDocAPI(app)
{
  const PAGE_SIZE = 20;
  app.get('/documents', (req,res) => {
    let params = {};
    console.log("searching for doc",req.query);
    const term = req.query.filter.search;
    const page = req.query.filter.page;
    if(term.length > 1)
    {
      const rg = {$regex : ".*"+term+".*", $options:"i"};
      params = { $or: [{name: rg},{tags: rg},{owner: rg}]};
    }
    let query = shareDBConnection.createFetchQuery(contentCollectionName,params,[],(err, results) => {
      if(!err)
      {
        let docs = [];
        let startIndex = page * PAGE_SIZE < results.length ? page * PAGE_SIZE : results.length - PAGE_SIZE;
        startIndex = Math.max(0,startIndex);
        const endIndex = Math.min(startIndex + PAGE_SIZE, results.length);
        for(var i = startIndex; i < endIndex; i++)
        {
          docs.push({attributes:results[i].data,id:results[i].data.documentId,type:"document"});
        }
        docs.sort ((a, b) => {
          return new Date(b.attributes.created) - new Date(a.attributes.created);
        });
        res.status(200).send({data:docs});
      }
      else
      {
        res.status(400).send(err);
      }
    });
  });

  app.get('/documents/:id', (req,res) => {
    var doc = shareDBConnection.get(contentCollectionName, req.params.id);
    doc.fetch(function(err) {
      if (err) {
        console.log("database error making document");
        res.status(400).send("database error making document");
        return;
      }
      else
      {
        let reply = {attributes:doc.data,id:doc.data.documentId,type:"document"};
        console.log("returning ",{data:reply});
        res.status(200).send({data:reply});
      }
    });
  });

  app.post('/documents', app.oauth.authorise(), (req,res) => {
    let attr = req.body.data.attributes;
    console.log(attr);
    createDoc(attr.name, attr.owner, attr.isPrivate)
    .then(function(doc){
      res.type('application/vnd.api+json');
      res.status(200);
      var json = { data: { id: doc.data.documentId, type: 'document', attr: doc.data }};
      res.json(json);
    },
     function(err) {
       res.type('application/vnd.api+json');
       res.status(code);
       res.json({errors:[err]});
     });
  });
}

//FUNCTIONS

function getNewDocumentId(callback)
{
  const uuid = guid.guid();
  var doc = shareDBConnection.get(contentCollectionName, uuid);
  doc.fetch(function(err) {
    if (doc.type === null) {
      return callback(uuid);
    }
    else {
      getNewDocumentId(callback);
    }
  });
}

function getDefaultSource()
{
  return "<html>\n<head>\n</head>\n<body>\n<script language=\"javascript\" type=\"text/javascript\">\n\n</script>\n</body></html>"
}

function createDoc(docName,owner,isPrivate) {
  return new Promise((resolve, reject) => {
    console.log("creating doc");
    getNewDocumentId(function(uuid) {
      var doc = shareDBConnection.get(contentCollectionName, uuid);
      doc.fetch(function(err) {
        if (err) {
          console.log("database error making document");
          reject("database error making document");
          return;
        }
        if (doc.type === null) {
          doc.create({
            source:getDefaultSource(),
            owner:owner,
            isPrivate:isPrivate,
            name:docName,
            documentId:uuid,
            created:new Date(),
            lastEdited:new Date(),
            assets:[],
            tags:[]
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
