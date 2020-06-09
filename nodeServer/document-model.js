const ShareDB = require('sharedb');
const WebSocket = require('ws');
const WebSocketJSONStream = require('@teamwork/websocket-json-stream')
const mongo = require('mongodb');
const multiparty = require('connect-multiparty')();
const fs = require('fs');
const Gridfs = require('gridfs-stream');
const guid = require('./uuid.js');
const userAPI = require('./user-model.js');
let contentDBName = "";
let contentCollectionName = "";
let mongoUri = "";
var shareDBMongo;
var shareDB;
var shareDBConnection;
var gridFS;
var stream = require('stream');
const http = require("http")
let documentMongo;
const MAX_FILES_PER_DOC = 100000000;

var initDocAPI = function(
  server, app,
  db, collection, uri,
  redisConfig
)
{
  contentDBName = db;
  contentCollectionName = collection;
  console.log("DB:" + contentDBName + "/" + contentCollectionName);
  mongoUri = uri;
  startAssetAPI(server, app);
  shareDBMongo = require('sharedb-mongo')(mongoUri);
  let shareDBOptions = {
      db:shareDBMongo,
      disableDocAction: true,
      disableSpaceDelimitedActions: true,
  }
  if(redisConfig !== undefined) {
    console.log("adding redis pubsub")
    const redis = require("redis");
    const client = redis.createClient(
      redisConfig.redis_port,redisConfig.redis_ip, {
      'auth_pass': redisConfig.redis_key,
      'return_buffers': true
    }).on('error', (err) => console.error('ERR:REDIS:', err));
    shareDBOptions.pubsub = require('sharedb-redis-pubsub')({client: client});
  }
  shareDB = new ShareDB(shareDBOptions);
  shareDBConnection = shareDB.connect();

  startDocAPI(app);
  startWebSockets(server);
}

// ENDPOINTS

function handleError(err)
{
  console.log("error:"+err);
}

function startAssetAPI(server, app)
{
  documentMongo = mongo.MongoClient.connect(mongoUri, function(err, client) {
    if(err)
    {
      console.log("DOCUMENT MODEL - error connecting to database", err);
    }
    else
    {
      console.log("Connected successfully to asset database");
      const db = client.db(contentDBName);
      app.post('/ccAsset', app.oauth.authenticate(), function(req, res) {
        console.log("ccAsset", req.body, req.headers);
        var writestream = gridFS.createWriteStream({
          filename: req.headers['x-file-name'],
          mode: 'w',
          content_type: req.headers['content-type'],
        });
        var bufferStream = new stream.PassThrough();
        bufferStream.end(req.body);
        bufferStream.pipe(writestream);
        writestream.on('close', function(file) {
          const newAsset = {
            name:req.headers['x-file-name'],
            fileId:file._id,
            fileType:req.headers['content-type'],
            size:file.length
          };
          console.log('success uploading asset', file.length);
          res.status(200);
          res.json(newAsset);
        })
      });

      gridFS = Gridfs(db, mongo);
      app.post('/asset', multiparty, function(req,res) {
        const size = req.files.file.size;
        const docId = req.body.documentId;
        var doc = shareDBConnection.get(contentCollectionName, docId);
        doc.fetch(function(err) {
          if (err || !doc.data) {
            res.status(404).send("database error making document");
            return;
          }
          else
          {
            let quota = doc.data.assetQuota;
            if(!quota)
            {
              quota = 0;
            }
            //console.log("doc.data.assetQuota", quota, quota + size);
            if(quota + size > MAX_FILES_PER_DOC)
            {
              res.status(400)
              res.json({error:"toooooo much sizes"});
            }
            else
            {
              var writestream = gridFS.createWriteStream({
                filename: req.files.file.name,
                mode: 'w',
                content_type: req.files.file.mimetype,
                metadata: req.body
              });

              fs.createReadStream(req.files.file.path).pipe(writestream);
              writestream.on('close', function(file) {
                const content_type = req.files.file.headers["content-type"];
                const newAsset = {
                  name:req.files.file.name,
                  fileId:file._id,
                  fileType:content_type,
                  size:file.length
                };
                console.log('success uploading asset', file.length);
                res.status(200);
                res.json(newAsset);
                fs.unlink(req.files.file.path, function(err) {
                   console.log('success!')
                 });
              });
            }
          }
        });
      });

      // app.post('/assetWithURL', app.oauth.authenticate(), function(req,res) {
      //   console.log("assetWITHURL", req.body)
      //   const mimetype = req.body.mimetype;
      //   const name = req.body.name;
      //   const url = req.body.url;
      //   var writestream = gridFS.createWriteStream({
      //     filename: name,
      //     mode: 'w',
      //     content_type: mimetype,
      //   });
      //
      //   http.get(url, response => {
      //     console.log('got resource', response.body)
      //     var stream = response.pipe(writestream);
      //     writestream.on('close', function(file) {
      //       const content_type = mimetype;
      //       const newAsset = {
      //         name:name,
      //         fileId:file._id,
      //         fileType:content_type,
      //         size:file.length
      //       };
      //       console.log('success uploading asset', file.length);
      //       res.status(200);
      //       res.json(newAsset);
      //       fs.unlink(url, function(err) {
      //          console.log('success!')
      //        });
      //     });
      //   });
      // });

      app.get('/asset/:docid/:filename', function(req, res) {
        var doc = shareDBConnection.get(contentCollectionName, req.params.docid);
        doc.fetch(function(err) {
          if (err || !doc.data) {
            res.status(404).send("database error making document");
            return;
          }
          else
          {
            let match = false;
            doc.data.assets.forEach((asset)=> {
              if(asset.name === req.params.filename)
              {
                console.log(asset.name, asset.fileId)
                var readstream = gridFS.createReadStream({
                  _id: asset.fileId
                });
                readstream.pipe(res);
                match = true;
              }
            });
            if(!match)
            {
              res.status(404).send("asset not found");
            }
          }
        });
      });

      app.delete('/asset/:docid/:filename', app.oauth.authenticate(), function(req, res) {
        var doc = shareDBConnection.get(contentCollectionName, req.params.docid);
        doc.fetch(function(err) {
          if (err || !doc.data) {
            res.status(404).send("database error making document");
            return;
          }
          else
          {
            let match = false;
            console.log("searching ",doc.data.assets,"for", req.params.filename)
            doc.data.assets.forEach((asset)=> {
              if(asset.name === req.params.filename)
              {
                match = true;
                canDeleteAsset(db, req.params.docid, asset).then(()=>
                {
                  gridFS.remove({_id:asset.fileId}, function (err, gridFSDB) {
                    if (err) return handleError(err);
                    res.status(200).json({id:asset.fileId, action:"deleted"});
                  });
                }).catch((err)=> {
                  res.status(200).json({id:asset.fileId, action:"not deleted, in use by others"});
                });
              }
            });
            if(!match)
            {
              res.status(404).send("asset not found");
            }
          }
        });
      });
    }
  });
}

function canDeleteAsset(db, docId, asset) {
  return new Promise((resolve, reject)=> {
    const query = {assets:{$elemMatch:{fileId:asset.fileId}}};
    db.collection(contentCollectionName).find(query).toArray(function(err, result) {
      console.log("assets found in ", result.length, "docs");
      if(err || result.length > 1)
      {
        console.log("asset used by other docs");
        reject();
      }
      else if (result.length == 1)
      {
        if(result[0].documentId == docId)
        {
          console.log("asset only used by target doc");
          resolve();
        }
        else
        {
          console.log("asset used by other docs");
          reject();
        }
      }
      else
      {
        console.log("asset used by no docs");
        resolve();
      }
    });
  });
};

function copyAssets(assets)
{
  return new Promise((resolve, reject)=> {
    resolve(assets);
  })
}

function startWebSockets(server)
{
  var wss = new WebSocket.Server({server: server});

  wss.on('connection', (ws, req) => {
    var stream = new WebSocketJSONStream(ws);
    ws.on('message', function incoming(data) {
      //console.log('server weboscket message',data);
    });
    stream.on('error', error => {
      if (error.message.startsWith('WebSocket is not open')) {
          // No point reporting this error, as it happens often and is harmless.
          return
      }

    })

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
  app.post('/submitOp', app.oauth.authenticate(), (req,res) => {
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
      { $match : { isPrivate : false } },
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

    //console.log("fetching docs",req.query.filter);

    const term = req.query.filter.search;
    const page = req.query.filter.page;
    let sortBy = req.query.filter.sortBy;
    const currentUser = req.query.filter.currentUser;

    let searchTermOr = {};
    if(term.length > 1)
    {
      const rg = {$regex : ".*"+term+".*", $options:"i"};
      searchTermOr = { $or: [{name: rg},{tags: rg},{ownerId: rg},{owner: rg}]};
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
             {parent: null},
             { children : { $exists : true } },
             {$or: [{ownerId: currentUser}, {isPrivate: false}]}
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
        //console.log("found " + results.length + " docs");
        var fn = (doc) => {
          return {attributes:doc.data,id:doc.data.documentId,type:"document"}
        }
        res.status(200).send({data:results.map(fn)});
      }
    });
  });

  app.delete('/documents/:id', app.oauth.authenticate(), (req, res) => {
    var doc = shareDBConnection.get(contentCollectionName, req.params.id);
    //console.log("delete doc called",  req.params.id)
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

  app.get('/source/:id', (req,res) => {
    var doc = shareDBConnection.get(contentCollectionName, req.params.id);
    doc.fetch(function(err) {
      if (err || !doc.data) {
        console.log("database error making document", doc.id);
        res.status(404).send("database error making document" + err);
        return;
      }
      else
      {
        //console.log("sending",doc.data["source"]);
        res.header("Content-Type", "application/javascript; charset=UTF-8");
        res.header("Cache-Control", "no-store");
        res.status(200).send(doc.data["source"]);
      }
    });
  });

  app.get('/documents/:id', (req,res) => {
    var doc = shareDBConnection.get(contentCollectionName, req.params.id);
    doc.fetch(function(err) {
      if (err || !doc.data) {
        console.log("database error making document", doc.id);
        res.status(404).send("database error making document" + err);
        return;
      }
      else
      {
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
        //console.log("Patching candidates", patched);
        const current = doc.data;
        let actions = [];
        const IGNORE_LIST = ["source", "documentId"]
        for (var key in patched) {
            if (current.hasOwnProperty(key) && patched.hasOwnProperty(key)) {
                if(JSON.stringify(current[key]) !== JSON.stringify(patched[key]))
                {
                  //DONT UPDATE THE SOURCE OR THE DOCUMENT ID
                  if(!IGNORE_LIST.includes(key))
                  {
                    //console.log("PATCHING", key, patched[key])
                    const op = {p:[key], oi:patched[key]};
                    actions.push(submitOp(docId, op));
                  }
                }
            }
            else
            {
              //console.log("PATCHING NEW FIELD", key, patched[key])
              const op = {p:[key], oi:patched[key]};
              actions.push(submitOp(docId, op));
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

  app.get('/documents/ops/:id', app.oauth.authenticate(),(req,res) => {
    //console.log("fetching ops for", contentCollectionName, req.params.id);
    const callback = function (err, results) {
      res.status(200).send({data:results});
    };
    shareDBMongo.getOps(contentCollectionName, req.params.id, null, null, {}, callback);
  });

  app.options('/documents', (req,res) => {
    res.send(200)
  });

  app.post('/documents', app.oauth.authenticate(), (req,res) => {
    //console.log("POST document", req.body.data.attributes)
    let attr = req.body.data.attributes;
    createDoc(attr)
    .then(function(doc) {
      res.type('application/vnd.api+json');
      res.status(200);
      var json = { data: { id: doc.data.documentId, type: 'document', attr: doc.data }};
      res.json(json);
    },
     function(err) {
       res.type('application/vnd.api+json');
       res.status(400);
       res.json({errors:[err]});
     });
  });

  app.post('/library', app.oauth.authenticate(), (req, res)=> {
    //console.log(req.body)
    let lib = req.body.data.lib;
    let documentId = req.body.data.documentId;
    let doc = shareDBConnection.get(contentCollectionName, documentId);
    doc.fetch(function(err) {
      if (err || !doc.data) {
        console.log("error making doc");
        res.status(404).send("database error making document" + err);
        return;
      }
      else
      {
        let op = insertLibrary(lib, doc.data.source)
        submitOp(documentId, op).then(()=> {
          res.status(200).send();
        }).catch((err)=> {
          res.status(404).send(err);
        })
      }
    });

  });

}

//FUNCTIONS

function submitOp(docId, op) {
  //console.log("submitting op", docId, op);
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
      typeof op.sd == 'undefined'&&
      typeof op.si == 'undefined')
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
          //console.log("success submitting op");
          resolve();
          return;
        }
      });
    });
  });
}

const libraryMap = [
  {title:"ThreeJS", id:"THREE", url:"https://cdnjs.cloudflare.com/ajax/libs/three.js/r73/three.min.js"},
  {title:"MMLL", id:"mmll", url:"https://mimicproject.com/libs/MMLL.js"},
  {title:"Marked", id:"Marked", url:"https://mimicproject.com/libs/marked.js"},
  {title:"MaxiLib", id:"maxiLib", url:"https://mimicproject.com/libs/maxiLib.js"},
  {title:"MaximJS", id:"MaximJS", url:"https://mimicproject.com/libs/maxim.js"},
  {title:"Nexus", id:"nexusUI", url:"https://mimicproject.com/libs/nexusUI.min.js"},
  {title:"Processing", id:"processing.js", url:"https://mimicproject.com/libs/processing.js"},
  {title:"p5", id:"p5", url:"https://mimicproject.com/libs/p5.min.js"},
  {title:"SoundJS", id:"SoundJS", url:"https://mimicproject.com/libs/soundjs.js"}
];

function libraryURL(id) {
  let url = ""
  libraryMap.forEach((lib)=>{
    if(lib.id == id) {
      url = lib.url
    }
  })
  //console.log("matched lib", url)
  return url;
}

function insertLibrary(lib, source) {
  //console.log('inserting library', lib, source)
  let insertAfter = "<head>"
  let searchIndex = source.indexOf(insertAfter);
  let index = 0;
  if(searchIndex >= 0)
  {
    index = searchIndex + insertAfter.length;
  }
  else
  {
    insertAfter = "<body>"
    searchIndex = source.indexOf(insertAfter);
    index = searchIndex + insertAfter.length;
  }
  let insert = "\n <script src = \"" + libraryURL(lib) +
  "\"></script>"
  const op = {p: ["source", index], si:insert};
  return op;
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
    getNewDocumentId(function(uuid) {
      //console.log("creating doc", contentCollectionName, uuid);
      var doc = shareDBConnection.get(contentCollectionName, uuid);
      doc.fetch(function(err) {
        if (err) {
          console.log("database error making document");
          reject("database error making document");
          return;
        }
        if (doc.type === null) {
          doc.create({
            source:"",
            ownerId:attr.ownerId,
            owner:attr.owner,
            isPrivate:attr.isPrivate,
            readOnly:true,
            name:attr.name,
            documentId:uuid,
            created:new Date(),
            lastEdited:new Date(),
            assets:attr.assets ? attr.assets : [],
            tags:attr.tags ? attr.tags:[],
            forkedFrom:attr.forkedFrom,
            savedVals:{},
            newEval:"",
            stats:{views:0, forks:0, edits:0},
            flags:0,
            dontPlay:false,
            isCollaborative:false,
            children:[],
            parent:attr.parent,
            type:attr.parent ? null : "html",
            assetQuota:attr.assetQuota ? attr.assetQuota : 0
          },()=> {
            let op = {};
            op.p = ['source',0];
            op.si = attr.source;
            doc.submitOp(op);
            resolve(doc);
            return;
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

/////helpers

const dropDocs = () => {
  return new Promise((resolve, reject) => {
    mongo.MongoClient.connect(mongoUri, function(err, client) {
      if(err)
      {
        console.log("DOCUMENT MODEL - error connecting to database", err);
      }
      else
      {
        console.log("Connected successfully to mongo");
        docDB = client.db(contentDBName);
        docDB.collection(contentCollectionName).drop();
      }
    });
  });
}

const dropAssets = () => {
  return new Promise((resolve, reject) => {
    mongo.MongoClient.connect(mongoUri, function(err, client) {
      if(err)
      {
        console.log("DOCUMENT MODEL - error connecting to database", err);
      }
      else
      {
        console.log("Connected successfully to mongo");
        docDB = client.db(contentDBName);
        docDB.collection('fs.chunks').drop();
        docDB.collection('fs.files').drop();
      }
    });
  });
}

const removeDocs = (ids) =>
{
  console.log("removing docs",ids);
  return new Promise((resolve, reject) => {
    mongo.MongoClient.connect(mongoUri, function(err, client) {
      if(err)
      {
        console.log("DOCUMENT MODEL - error connecting to database", err);
      }
      else
      {
        console.log("Connected successfully to mongo");
        docDB = client.db(contentDBName);
        docDB.collection(contentCollectionName).deleteMany({ _id: { $in: ids } }, function(err, obj) {
          console.log(err, obj.result)
          if (err) {
            reject(err)
          } else  {
            resolve();
          }
          docDB.close();
        });
      }
    });
  });
}

module.exports = {
  initDocAPI:initDocAPI
}

if(process.env.NODE_ENV == "test") {
  module.exports.dropDocs = dropDocs,
  module.exports.createDoc = createDoc,
  module.exports.removeDocs = removeDocs,
  module.exports.dropAssets = dropAssets
}
