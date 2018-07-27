var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var mongo = require('mongodb');
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
var gridFS;

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
    gridFS = Gridfs(db, mongo);
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
        let doc = shareDBConnection.get(contentCollectionName,req.body.documentId)
        var newAssets = doc.data.assets;
        newAssets.push({'name':req.files.file.name,"fileId":file._id,fileType:content_type});
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
        var newAssets = doc.data.assets;
        newAssets = newAssets.filter(function( asset ) {
            return asset.fileId !== req.params.id;
        });
        doc.submitOp({p:['assets'],oi:newAssets},{source:'server'});
        res.json(200);
      });
    });
  });
}

function copyAssets(assets)
{
  var copyAsset = function(asset) {
    return new Promise((resolve, reject) => {
      var writestream = gridFS.createWriteStream({
        filename: asset.name,
        mode: 'w',
        content_type: asset.fileType
      });
      var readstream = gridFS.createReadStream({
         _id: asset.fileId
      });
      readstream.pipe(writestream);
      writestream.on('close', function(file) {
        var newAsset = {'name':asset.name,"fileId":file._id,fileType:asset.fileType};
        resolve(newAsset);
      });
    });
  };
  return Promise.all(assets.map(copyAsset));
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
  app.post('/submitOp', app.oauth.authorise(), (req,res) => {
    try {
      const op = req.body.op;
      if(op.p)
      {
        const asInt = parseInt(op.p[1]);
        if(!isNaN(asInt))
        {
          op.p[1] = asInt;
        }
      }
      const docId = req.body.documentId;
      const doc = shareDBConnection.get(contentCollectionName, docId);
      if(!op.si && !op.sd && !op.oi)
      {
        res.status(400);
        res.json({errors:["no objects in op"]});
        return;
      }
      doc.fetch((err)=>{
        console.log('submitting op', op, doc.id);
        try {
          doc.submitOp(op);
        }
        catch(err)
        {
          console.log(err);
          res.status(400);
          res.json({errors:[err]});
          return;
        }
      });
    }
    catch (err)
    {
      console.log(err);
      res.status(400);
      res.json({errors:[err]});
      return;
    }
    res.sendStatus(200);
  });

  const PAGE_SIZE = 20;
  app.get('/documents', (req,res) => {
    let params = {};
    const term = req.query.filter.search;
    const page = req.query.filter.page;
    const sortBy = req.query.filter.sortBy;
    const currentUser = req.query.filter.currentUser;
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
        let i = 0;
        while(docs.length < PAGE_SIZE && startIndex + i < results.length)
        {
          const data = results[i].data;
          if(!data.isPrivate || data.owner == currentUser)
          {
            docs.push({attributes:data,id:data.documentId,type:"document"});
          }
          i++;
        }
        if(sortBy == "views")
        {
          docs.sort ((a, b) => {
            let b_views = 0;
            let a_views = 0;
            if(b.attributes.stats)
            {
              b_views = b.attributes.stats.views;
            }
            if(a.attributes.stats)
            {
              a_views = a.attributes.stats.views;
            }
            return b_views - a_views;
          });
        }
        else if (sortBy == "forks")
        {
          docs.sort ((a, b) => {
            let b_forks = 0;
            let a_forks = 0;
            if(b.attributes.stats)
            {
              b_forks = b.attributes.stats.forks;
            }
            if(a.attributes.stats)
            {
              a_forks = a.attributes.stats.forks;
            }
            return b_forks - a_forks;
          });
        }
        else if (sortBy == "size")
        {
          docs.sort ((a, b) => {
            return b.data.source.length - a.data.source.length;
          });
        }
        else if (sortBy == "edits")
        {
          docs.sort ((a, b) => {
            return b.data.source.length - a.data.source.length;
          });
        }
        else
        {
          docs.sort ((a, b) => {
            return new Date(b.attributes.created) - new Date(a.attributes.created);
          });
        }
        res.status(200).send({data:docs});
      }
      else
      {
        res.status(400).send(err);
      }
    });
  });

  app.delete('/documents/:id', app.oauth.authorise(), (req, res) => {
    var doc = shareDBConnection.get(contentCollectionName, req.params.id);
    doc.fetch(function(err) {
      if (err || !doc.data) {
        res.status(404).send("database error making document");
        return;
      }
      else
      {
        doc.del([],(err)=>{
          res.status(200).send("document deleted");
        });
      }
    });
  });

  app.get('/documents/:id', (req,res) => {
    var doc = shareDBConnection.get(contentCollectionName, req.params.id);
    doc.fetch(function(err) {
      if (err || !doc.data) {
        res.status(404).send("database error making document");
        return;
      }
      else
      {
        let reply = {attributes:doc.data,id:doc.data.documentId,type:"document"};
        res.status(200).send({data:reply});
      }
    });
  });

  app.get('/documents/ops/:id', (req,res) => {
    console.log("fetching ops for", contentCollectionName, req.params.id);
    const callback = function (err, results) {
      res.status(200).send({data:results});
    };
    shareDBMongo.getOps(contentCollectionName, req.params.id, null, null, {}, callback);
  });

  app.post('/documents', app.oauth.authorise(), (req,res) => {
    let attr = req.body.data.attributes;
    createDoc(attr)
    .then(function(doc){
      res.type('application/vnd.api+json');
      res.status(200);
      var json = { data: { id: doc.data.documentId, type: 'document', attr: doc.data }};
      if(doc.data.forkedFrom)
      {
        copyAssets(attr.assets).then((newAssets)=>{
          doc.submitOp({p:['assets'],oi:newAssets},{source:'server'});
          json.data.attr.assets = newAssets;
          res.json(json);
        });
      }
      else
      {
        res.json(json);
      }
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

function createDoc(attr) {
  return new Promise((resolve, reject) => {
    console.log("creating doc", attr);
    getNewDocumentId(function(uuid) {
      var doc = shareDBConnection.get(contentCollectionName, uuid);
      doc.fetch(function(err) {
        if (err) {
          console.log("database error making document");
          reject("database error making document");
          return;
        }
        if (doc.type === null) {
          const tags = attr.tags ? attr.tags:[];
          doc.create({
            source:"",
            owner:attr.owner,
            isPrivate:attr.isPrivate,
            readOnly:true,
            name:attr.name,
            documentId:uuid,
            created:new Date(),
            lastEdited:new Date(),
            assets:[],
            tags:tags,
            forkedFrom:attr.forkedFrom,
            savedVals:{},
            newEval:"",
            stats:{views:0,forks:0},
            flags:0,
            dontPlay:false
          },()=> {
            console.log("callback");
            let op = {};
            op.p = ['source',0];
            op.si = attr.source;
            console.log("submitting FIRST op", op);
            doc.submitOp(op);
            resolve(doc);
          });
          resolve(doc);
          return;
        }
        reject("document with that name alrady exists");
        return;
      });
    });
  });
}

module.exports = {
  initDocAPI:initDocAPI
}
