const ShareDB = require('sharedb');
const WebSocket = require('ws');
const WebSocketJSONStream = require('websocket-json-stream');
const mongo = require('mongodb');
const multiparty = require('connect-multiparty')();
const fs = require('fs');
const Gridfs = require('gridfs-stream');
const guid = require('./uuid.js');
const userAPI = require('./user-model.js');
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

  startAssetAPI(app);

  shareDBMongo = require('sharedb-mongo')('mongodb://'+mongoIP+':'+mongoPort+'/'+contentDBName);
  shareDB = new ShareDB({db:shareDBMongo});
  shareDBConnection = shareDB.connect();
  startDocAPI(app);
  startWebSockets(server);
}

// ENDPOINTS

function handleError(err)
{
  console.log("error:"+err);
}

function startAssetAPI(app)
{
  const url = 'mongodb://'+mongoIP+':'+mongoPort+'/'+contentDBName;
  mongo.MongoClient.connect(url, function(err, client) {
    if(err)
    {
      console.log("error connecting to database", err);
    }
    else
    {
      console.log("Connected successfully to server");
      const db = client.db(contentDBName);

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
    }
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
    try {
      shareDB.listen(stream);
    }
    catch (err)
    {
      console.log("web socket error", err);
    }
  });
}

function startDocAPI(app)
{
  app.post('/submitOp', app.oauth.authorise(), (req,res) => {
    const op = req.body.op;
    const docId = req.body.documentId;
    submitOp(docId, op)
    .then(()=>{
      res.sendStatus(200);
    }).catch((err)=> {
      res.status(400);
      res.json(err);
    })
  });

  app.get('/tags', (req, res) => {
    let limit = parseInt(req.query.limit);
    if(!limit)
    {
      limit = 5;
    }
    const query = {$aggregate : [
      { $unwind : "$tags" },
      { $group : { _id : "$tags" , count : { $sum : 1 } } },
      { $sort : { count : -1 } },
      { $limit : limit } ]
    }
    shareDBMongo.allowAggregateQueries = true;
    shareDBMongo.query(contentCollectionName, query, null, null, function (err, extra, results) {
      if(err)
      {
        res.status(400).send({error:err});
      }
      else
      {
        res.status(200).send({data:results});
      }
    });

  });

  const PAGE_SIZE = 20;
  app.get('/documents', (req,res) => {

    console.log("fetching docs");

    const term = req.query.filter.search;
    const page = req.query.filter.page;
    let sortBy = req.query.filter.sortBy;
    const currentUser = req.query.filter.currentUser;

    let searchTermOr = {};
    if(term.length > 1)
    {
      const rg = {$regex : ".*"+term+".*", $options:"i"};
      searchTermOr = { $or: [{name: rg},{tags: rg},{owner: rg}]};
    }

    let s = {};
    if(sortBy == "views") {
      sortBy = 'stats.views';
      s[sortBy] = -1;
    } else if (sortBy == "forks") {
      sortBy = 'stats.forks';
      s[sortBy] = 1;
    } else if (sortBy == "size") {
      sortBy = 'source.length';
      s[sortBy] = 1;
    } else if (sortBy == "date") {
      sortBy = 'created';
      s[sortBy] = -1;
    } else if (sortBy == "updated") {
      sortBy = 'lastEdited';
      s[sortBy] = -1;
    } else if (sortBy == "edits") {
      sortBy = 'stats.edits';
      s[sortBy] = -1;
    }

    const query = {
      $and: [searchTermOr,
             {parent: ""},
             {$or: [{owner: currentUser}, {isPrivate: false}]}
           ],
      $sort: s,
      $limit: PAGE_SIZE,
      $skip: page * PAGE_SIZE
    }
    shareDBMongo.query(contentCollectionName, query, null, null, function (err, results, extra) {
      if(err)
      {
        res.status(400).send({error:err});
      }
      else
      {
        var fn = (doc) => {
          return {attributes:doc.data,id:doc.data.documentId,type:"document"}
        }
        res.status(200).send({data:results.map(fn)});
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
        console.log("fetched doc", req.params.id);
        let reply = {attributes:doc.data,id:doc.data.documentId,type:"document"};
        res.status(200).send({data:reply});
      }
    });
  });

  app.patch('/documents/:id', (req,res) => {
    const docId = req.params.id;
    var doc = shareDBConnection.get(contentCollectionName, docId);
    doc.fetch(function(err) {
      if (err || !doc.data) {
        res.status(404).send("database error making document");
        return;
      }
      else
      {
        let patched = req.body.data.attributes;
        const current = doc.data;
        let actions = [];
        for (var key in current) {
            if (current.hasOwnProperty(key)) {
                if(JSON.stringify(current[key]) !== JSON.stringify(patched[key]))
                {
                  console.log("PATCHING", key)
                  const op = {p:[key],oi:patched[key]};
                  actions.push(submitOp(docId, op));
                }
            }
        }
        if(actions.length > 0)
        {
          Promise.all(actions).then(()=>{
            let reply = {attributes:patched, id:docId, type:"document"};
            res.status(200);
            res.json({data:reply});
          }).catch((err)=> {
            res.status(400);
            res.json(err);
          })
        }
        else
        {
          let reply = {attributes:patched,id:doc.data.documentId,type:"document"};
          res.status(200).send({data:reply});
        }

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
    .then(function(doc) {
      res.type('application/vnd.api+json');
      res.status(200);
      var json = { data: { id: doc.data.documentId, type: 'document', attr: doc.data }};
      if(attr.parent != "") {
        var parent = shareDBConnection.get(contentCollectionName, attr.parent);
        parent.fetch(function(err) {
          if (!err && parent.data) {
            let children  = parent.data.children;
            children.push(doc.data.documentId);
            parent.submitOp({p:['children'],oi:children},{source:'server'});
          }
        });
      }
      if(doc.data.forkedFrom != "")
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

function submitOp(docId, op) {
  console.log("submitting op", docId, op);
  return new Promise((resolve, reject) => {
    if(op.p)
    {
      const asInt = parseInt(op.p[1]);
      if(!isNaN(asInt))
      {
        op.p[1] = asInt;
      }
    }
    if(typeof op.oi == 'undefined' &&
      typeof op.oi == 'undefined'&&
      typeof op.oi == 'undefined')
    {
      console.log("no objects in op", op)
      reject({errors:["no objects in op"]});
      return;
    }
    const doc = shareDBConnection.get(contentCollectionName, docId);
    doc.fetch((err)=>{
      if(err) {
        console.log(err);
        reject({errors:["errorFetching",err]});
        return;
      }
      doc.submitOp(op, (err)=> {
        if(err)
        {
          console.log("error submitting op",err);
          reject({errors:["errorSubmitting",err]});
          return;
        }
        else
        {
          console.log("success submitting op");
          resolve();
          return;
        }
      });
    });
  });
}

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
            stats:{views:0, forks:0, edits:0},
            flags:0,
            dontPlay:false,
            children:[],
            parent:attr.parent
          },()=> {
            let op = {};
            op.p = ['source',0];
            op.si = attr.source;
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
