const mongo = require('mongodb');
const Grid = require('gridfs');
var http = require('http');
var express = require('express');
var cors = require('express-cors');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var db
var gridFS
//const CODE_CIRCLE_USER_ID = "2a19e213-d6c4-d3c0-a6a7-781f64622703"
const CODE_CIRCLE_USER_ID = "476c9092-5d8a-747d-7089-9b4af31fddae"
const CODE_CIRCLE_USER_NAME = "codecircle"
const ASSET_SERVING_PORT = 3000
const cc_mongoIP = "127.0.0.1";
const cc_mongoPort = "27017";
const cc_contentDBName = "cc_documents";
//const MIMIC_API_URL = "https://dev.codecircle.gold.ac.uk/api"
const MIMIC_API_URL = "http://localhost:8080"
const cc_mongoUri = 'mongodb://'+cc_mongoIP+':'+cc_mongoPort+'/'+cc_contentDBName;
const app = express();
let token = "";
var FormData = require('form-data');
var toArray = require('stream-to-array')

const upload =
[
//"65gmEWQbALkbQNPya",
// "xwwTkx4bowrHQhYSz",
// "auFBDt9CCCxJ5uCa3",
// "j3h8FvfvLiXx45X7x",
// "eea5ERsNRT7Qdrb2Y",
// "KddxGTEhyC9FENyTJ",
// "qagRGoZYgArmKgAb3",
// "QtBmG3omkKHbwa7bF",
// "e4YoWDX3P57PEHkzv",
// 'PtCfEgLNYmT4YLHtK',
// 'CA4RuTqopxco34weL',
// 'jbnJRvwiDbznTk2cQ',
// 'cgJMcjXgunAemDD7B',
// 'DgwG7gm6EsYYRPp7W',
// 'GAR9Tv9LXrRYBxSL7',
'HfvHJWxKLPJBxYpTW',
// 'ywwcqZjWfujwiGX4J',
// 'uYk2SLcT77YJFL7Xu',
// 'sY9PXXZGjAgv48NGY',
// 'twzXajMKHNM5uraTb',
// 'sPC9w7mFD5GFfPrSS',
// 'Pna9FNXgW2AmeRx25',
// 'pWQrQZbmawfrADq89',
// 'XfoN9skouxfrjKqwY',
// 'oXTCJ3FgK7kiyemp8',
// 'ipTKvFqtECLC5FybA',
// "cmNvBAHzcceFQH5cy",
// "zBZoTXxSrmHvXReLW",
// "Y42hpBSymrgQuf2gJ"
]

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
server.listen(ASSET_SERVING_PORT);

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
    upload.forEach((doc)=> {
      transferDoc(doc)
    })
  }
});


var transferDoc = (docid)=> {
  console.log("tranferring", docid)
  return new Promise((resolve, reject)=> {
    getSnapshot(docid).then((snapshot)=> {
      getDocumentData(docid).then((doc)=> {
        getToken().then(()=> {
          postDoc(snapshot, doc).then((newDocID)=>{
            postLibraries(newDocID, doc.libs).then(()=>{
              postAssets(docid, newDocID).then((uploaded)=> {
                patchAssets(uploaded, newDocID).then(()=> {
                  resolve()
                })
              })
            })
          })
        })
      })
    })
  }).catch(err=>reject(err))
}


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

var getToken = ()=> {
  return new Promise((resolve, reject)=> {
    var tokenHTTP = new XMLHttpRequest();
    var data = 'client_id=application&'+
    'client_secret=secret&' +
    'grant_type=password&'+
    'username=codecircle&'+
    'password=password'
    tokenHTTP.onreadystatechange = ()=> {
        console.log(tokenHTTP.readyState, tokenHTTP.status)
        if (tokenHTTP.readyState == 4 && tokenHTTP.status == 200)
        {
          console.log("success  doc", )
          token =  JSON.parse(tokenHTTP.responseText).access_token
          resolve()
        }
    }
    tokenHTTP.onerror = (err)=> {
      console.log("ERROR", err)
    }
    tokenHTTP.open("POST", MIMIC_API_URL + "/oauth/token", true);
    tokenHTTP.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    tokenHTTP.send(data);
  })
}

var postDoc = (snapshot, doc)=> {
  console.log("POSTing")
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

    docHTTP.open("POST", MIMIC_API_URL + "/documents", true);
    docHTTP.setRequestHeader("Content-Type", "application/json");
    docHTTP.setRequestHeader('Authorization', 'Bearer ' + token);
    docHTTP.send(JSON.stringify(data));
  })
}

var postLibraries = (docid, libs)=> {
  return new Promise((resolve, reject)=> {
    console.log("NUM libs",libs.length)
    if(libs.length > 0)
    {
      libs.forEach((lib)=> {
        console.log(lib)
        var uploaded = 0;
        var libHTTP = new XMLHttpRequest();
        var libData = {
          data:{
            documentId: docid,
            lib:lib
          }
        }
        libHTTP.onreadystatechange = async ()=> {
          if (libHTTP.readyState == 4 && libHTTP.status == 200)
          {
            console.log("success adding lib",)
            uploaded++
            if(uploaded == libs.length)
            {
              resolve(uploaded)
            }
          }
        }
        libHTTP.open("POST", MIMIC_API_URL + "/library", true);
        libHTTP.setRequestHeader("Content-Type", "application/json");
        libHTTP.setRequestHeader('Authorization', 'Bearer ' + token);
        libHTTP.send(JSON.stringify(libData));
      });
    }
    else
    {
      resolve();
    }
  });
}

var uploadedAssets = [];
var postAsset = (file) => {
  return new Promise((resolve, reject)=> {
    if(typeof file.copies === "undefined")
    {
      resolve();
    }
    else
    {
      const assetHTTP = new XMLHttpRequest();
      assetHTTP.onreadystatechange = ()=> {
        if (assetHTTP.readyState == 4 && assetHTTP.status == 200)
        {
          var uploadedAsset = JSON.parse(assetHTTP.responseText)
          console.log("success adding asset uploadedAsset", uploadedAssets, uploadedAsset)
          uploadedAssets.push(uploadedAsset)
          resolve()
        }
      }
      const assetID = file.copies.doc_assets.key;
      var readstream = gridFS.createReadStream({
         _id: assetID
      });
      toArray(readstream).then((parts)=> {
        const buffer = Buffer.concat(parts)
        assetHTTP.open('POST', MIMIC_API_URL + "/ccAsset", true);
        assetHTTP.setRequestHeader('X-File-Name', file.original.name);
        assetHTTP.setRequestHeader('X-File-Size', file.original.size);
        assetHTTP.setRequestHeader('Content-Type', file.original.type);
        assetHTTP.setRequestHeader('Authorization', 'Bearer ' + token);
        console.log("uploading",buffer, parts.length, file.original.name, file.original.size, file.original.type)
        assetHTTP.send(buffer);
      })
    }
  });

}

var postAssets = async (docid, newDocID)=> {
  console.log("uploading assets from", docid, "to", newDocID)
  return new Promise(async (resolve, reject)=> {
    getAssets(docid).then(async (assets)=> {
      console.log("NUM ASSETS",assets.length)
      uploadedAssets = [];
      for(let i = 0; i < assets.length; i++)
      {
        await postAsset(assets[i])
      }
      resolve(uploadedAssets)
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
    patchHTTP.open("PATCH", MIMIC_API_URL + '/documents/' + docid, true);
    patchHTTP.setRequestHeader("Content-Type", "application/json");
    patchHTTP.send(JSON.stringify(patchData));
  })

}
