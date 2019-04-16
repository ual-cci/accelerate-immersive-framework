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
let mongoUri = "";
var replicaSet = "";
var shareDBMongo;
var shareDB;
var shareDBConnection;
var gridFS;
const http = require("http")
var siteURL;

var initDocAPI = function(server, app, config)
{
  mongoIP = config.mongoIP;
  mongoPort = config.mongoPort;
  contentDBName = process.env.NODE_ENV == "test" ? config.test_contentDBName:config.contentDBName;
  contentCollectionName = config.contentCollectionName;
  replicaSet = config.replicaSet;
  console.log("ENVIRONMENT", process.env.NODE_ENV);
  mongoUri = 'mongodb://'+mongoIP+':'+mongoPort+'/'+contentDBName;
  if(replicaSet)
  {
    mongoUri = mongoUri + '?replicaSet='+replicaSet;
  }
  startAssetAPI(app);
  siteURL = config.siteURL;
  shareDBMongo = require('sharedb-mongo')(mongoUri);
  shareDB = new ShareDB({db:shareDBMongo,disableDocAction: true,disableSpaceDelimitedActions: true});
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
  mongo.MongoClient.connect(mongoUri, function(err, client) {
    if(err)
    {
      console.log("DOCUMENT MODEL - error connecting to database", err);
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
          const content_type = req.files.file.headers["content-type"];
          const newAsset = {'name':req.files.file.name,"fileId":file._id,fileType:content_type};
          console.log('success uploading asset');
          res.status(200);
          res.json(newAsset);
          fs.unlink(req.files.file.path, function(err) {
             console.log('success!')
           });
        });
      });

      app.post('/assetWithURL', app.oauth.authenticate(), function(req,res) {
        console.log("assetWITHURL", req.body)
        const mimetype = req.body.mimetype;
        const name = req.body.name;
        const url = req.body.url;
        var writestream = gridFS.createWriteStream({
          filename: name,
          mode: 'w',
          content_type: mimetype,
        });

        http.get(url, response => {
          console.log('got resource')
          var stream = response.pipe(writestream);
          writestream.on('close', function(file) {
            const content_type = mimetype;
            const newAsset = {'name':name,"fileId":file._id,fileType:content_type};
            console.log('success uploading asset');
            res.status(200);
            res.json(newAsset);
            fs.unlink(url, function(err) {
               console.log('success!')
             });
          });
        });
      });

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
              if(asset.name == req.params.filename)
              {
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

      app.delete('/asset/:id', app.oauth.authenticate(), function(req, res) {
        gridFS.remove({_id:req.params.id}, function (err, gridFSDB) {
          if (err) return handleError(err);
          console.log('success deleting asset');
          res.status(200);
          res.json(req.params.id);
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
        console.log(err);
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
        const current = doc.data;
        let actions = [];
        for (var key in current) {
            if (current.hasOwnProperty(key) && patched.hasOwnProperty(key)) {
                if(JSON.stringify(current[key]) !== JSON.stringify(patched[key]))
                {
                  //DONT UPDATE THE SOURCE OR THE DOCUMENT ID
                  if(key !== "source" && key !== "documentId")
                  {
                    console.log("PATCHING", key, patched[key])
                    const op = {p:[key], oi:patched[key]};
                    actions.push(submitOp(docId, op));
                  }
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

  app.get('/documents/ops/:id', app.oauth.authenticate(),(req,res) => {
    console.log("fetching ops for", contentCollectionName, req.params.id);
    const callback = function (err, results) {
      res.status(200).send({data:results});
    };
    shareDBMongo.getOps(contentCollectionName, req.params.id, null, null, {}, callback);
  });

  app.options('/documents', (req,res) => {
    res.send(200)
  });

  app.post('/documents', app.oauth.authenticate(), (req,res) => {
    let attr = req.body.data.attributes;
    console.log("POST document", req.route, req.body)
    createDoc(attr)
    .then(function(doc) {
      res.type('application/vnd.api+json');
      res.status(200);
      var json = { data: { id: doc.data.documentId, type: 'document', attr: doc.data }};
      if(doc.data.forkedFrom)
      {
        copyAssets(attr.assets).then((newAssets)=>{
          doc.submitOp({p:['assets'],oi:newAssets},{source:'server'});
          json.data.attr.assets = newAssets;
          res.json(json);
        }).catch((err)=>{
          res.type('application/vnd.api+json');
          res.status(400);
          res.json({errors:[err]});
        });
      }
      else
      {
        res.json(json);
      }
    },
     function(err) {
       res.type('application/vnd.api+json');
       res.status(400);
       res.json({errors:[err]});
     });
  });

  app.post('/library', app.oauth.authenticate(), (req, res)=> {
    console.log(req.body)
    let lib = req.body.data.lib;
    let documentId = req.body.data.documentId;
    let doc = shareDBConnection.get(contentCollectionName, documentId);
    doc.fetch(function(err) {
      console.log("fetched doc")
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
          console.log("success submitting op");
          resolve();
          return;
        }
      });
    });
  });
}

const libraryMap = [
  {title:"MMLL", id:"mmll", url:"MMLL.js"},
  {title:"Marked", id:"Marked", url:"marked.js"},
  {title:"MaxiLib", id:"maxiLib", url:"maxiLib.js"},
  {title:"MaximJS", id:"MaximJS", url:"maxim.js"},
  {title:"Nexus", id:"nexusUI", url:"nexusUI.min.js"},
  {title:"Processing", id:"processing.js", url:"processing.js"},
  {title:"p5", id:"p5", url:"p5.min.js"},
  {title:"SoundJS", id:"SoundJS", url:"soundjs.js"}
];

function libraryURL(id) {
  let url = ""
  libraryMap.forEach((lib)=>{
    if(lib.id == id) {
      url = lib.url
    }
  })
  console.log("matched lib", url)
  return url;
}

function insertLibrary(lib, source) {
  console.log('inserting library', lib, source)
  let insertAfter = "<head>"
  let index = source.indexOf(insertAfter) + insertAfter.length;
  let insert = "\n <script src = \"" +
  siteURL + "/libs/" + libraryURL(lib) +
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
            assets:[],
            tags:attr.tags ? attr.tags:[],
            forkedFrom:attr.forkedFrom,
            savedVals:{},
            newEval:"",
            stats:{views:0, forks:0, edits:0},
            flags:0,
            dontPlay:false,
            children:[],
            parent:attr.parent,
            type:attr.parent ? "js" : "html"
          },()=> {
            let op = {};
            op.p = ['source',0];
            op.si = attr.source;
            doc.submitOp(op);
            //console.log("document created", doc);
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

const dropDocs = (callback) => {
  console.log(shareDBMongo)
	mongo.collection(contentCollectionName).remove({}, callback());
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
  module.exports.createDoc = createDoc,
  module.exports.removeDocs = removeDocs,
  module.exports.dropAssets = dropAssets
}
