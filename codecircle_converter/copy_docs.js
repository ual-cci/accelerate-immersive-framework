const mongo = require('mongodb');
var cc_mongoIP = "127.0.0.1";
var cc_mongoPort = "27017";
var cc_contentDBName = "cc2_live";
var mimicURL = "https://www.dev.codecircle.gold.ac.uk/api/"
var cc_mongoUri = 'mongodb://'+cc_mongoIP+':'+cc_mongoPort+'/'+cc_contentDBName;
const Grid = require('gridfs');
var http = require('http');
var express = require('express');
var cors = require('express-cors');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var db
var gridFS
const CODE_CIRCLE_USER_ID = "52cdaefb-ac09-82cd-ef02-678b26b842a9"
const CODE_CIRCLE_USER_NAME = "codecircle"

const app = express();

console.log("STARTING SERVER")
app.use(express.static('static'));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({extended: true, limit: '50mb'}));
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Expose-Headers', 'Content-Length');
  res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
  if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
  } else {
      return next();
  }
});
app.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.send(200);
});

var server = http.createServer(app);
server.listen(3000);

mongo.MongoClient.connect(cc_mongoUri, (err, client)=> {
  if(err)
  {
    console.log("DOCUMENT MODEL - error connecting to database", err);
  }
  else
  {
    console.log("Connected successfully to server");
    db = client.db(cc_contentDBName);
    gridFS = Grid(db, mongo);
    app.get('/asset/:id', (req, res)=> {
      console.log("serving",req.params.id)
       var readstream = gridFS.createReadStream({
          _id: req.params.id
       });
       readstream.pipe(res);
    });
    transferDoc("5yafjXHiWzLFNZBNw")
  }
});

var getSnapshot = (docid) =>
{
  console.log("getting snapshot for", docid)
  return new Promise((resolve, reject)=> {
    let docsCollections = "docs"
    let query = {_id:docid}
    db.collection(docsCollections).findOne(query, (err, result)=> {
      if (err)
      {
        reject(err)
      }
      else
      {
        console.log("got snapshot")
        resolve(result.data.snapshot)
      }
    });
  })
}

var getDocumentData = (docid) => {
  console.log("getting document data for", docid)
  return new Promise((resolve, reject)=> {
    let docsCollections = "documents"
    let query = {_id:docid}
    db.collection(docsCollections).findOne(query, (err, result)=> {
      if (err)
      {
        reject(err)
      }
      else
      {
        console.log("got data")
        resolve(result)
      }
    });
  })
}

var getAssets = (docid)=> {
  console.log("getting assets for", docid)
  return new Promise((resolve, reject)=> {
    let docsCollections = "cfs.doc_assets.filerecord"
    let query = {"metadata.docid":docid}
    db.collection(docsCollections).find(query).toArray((err, results)=> {
      if (err)
      {
        reject(err)
      }
      else
      {
        console.log("got assets")
        resolve(results)
      }
    });
  })
}

var transferDoc = (docid)=> {
  console.log("tranferring", docid)
  return new Promise((resolve, reject)=> {
    getSnapshot(docid).then((snapshot)=> {
      getDocumentData(docid).then((doc)=> {
        postDoc(snapshot, doc).then((newDocID)=>{
          postAssets(docid, newDocID).then((uploaded)=> {
            patchAssets(uploaded, newDocID).then(()=> {
              resolve()
            })
          })
        })
      })
    })
  }).catch(err=>reject(err))
}

var postDoc = (snapshot, doc)=> {
  console.log("POSTing", doc)
  var tags = doc.tags
  tags.push("written by " + doc.username)
  console.log("tags", tags)
  return new Promise((resolve, reject)=> {
    var docHTTP = new XMLHttpRequest();
    var data = {
      data : {
          attributes: {
            source: snapshot,
            ownerId: CODE_CIRCLE_USER_ID,
            owner: CODE_CIRCLE_USER_NAME,
            isPrivate: false,
            tags:tags,
            name:doc.title
        }
      }
    }
    docHTTP.onreadystatechange = ()=> {
        if (docHTTP.readyState == 4 && docHTTP.status == 200)
        {
          console.log("success adding doc", JSON.parse(docHTTP.responseText).data.id)
          var newDocID = JSON.parse(docHTTP.responseText).data.id;
          resolve(newDocID)
        }
    }

    docHTTP.open("POST", "http://localhost:8080/documents", true);
    docHTTP.setRequestHeader("Content-Type", "application/json");
    docHTTP.send(JSON.stringify(data));
  })
}

var postAssets = (docid, newDocID)=> {
  console.log("uploading assets from", docid, "to", newDocID)
  return new Promise((resolve, reject)=> {
    getAssets(docid).then((assets)=> {
      console.log("NUM ASSETS",assets.length)
      assets.forEach((file)=> {
        console.log(file)
        var uploaded = [];
        var assetHTTP = new XMLHttpRequest();
        var assetData = {
          url: 'http://localhost:3000/asset/'+file.copies.doc_assets.key,
          mimetype: file.original.type,
          name:file.original.name
        }
        assetHTTP.onreadystatechange = async ()=> {
          if (assetHTTP.readyState == 4 && assetHTTP.status == 200)
          {
              var uploadedAsset = JSON.parse(assetHTTP.responseText)
              console.log("success adding asset", )
              uploaded.push(uploadedAsset)
              if(uploaded.length == assets.length)
              {
                resolve(uploaded)
              }
          }
        }
        assetHTTP.open("POST", "http://localhost:8080/assetWithURL", true);
        assetHTTP.setRequestHeader("Content-Type", "application/json");
        assetHTTP.send(JSON.stringify(assetData));
      })
    })
  })
}

var patchAssets = (uploaded, docid)=> {
  console.log("patching assets for ", docid)
  return new Promise((resolve, reject)=> {
    patchHTTP = new XMLHttpRequest();
    var patchData = {
      data : {
        attributes: {
          assets:uploaded
        }
      }
    }
    patchHTTP.onreadystatechange = async ()=> {
      if (patchHTTP.readyState == 4 && patchHTTP.status == 200)
      {
        console.log("patch success")
        resolve()
      }
    }
    patchHTTP.open("PATCH", 'http://localhost:8080/documents/' + docid, true);
    patchHTTP.setRequestHeader("Content-Type", "application/json");
    patchHTTP.send(JSON.stringify(patchData));
  })

}
