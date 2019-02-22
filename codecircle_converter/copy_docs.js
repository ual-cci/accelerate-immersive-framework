const mongo = require('mongodb');
var cc_mongoIP = "127.0.0.1";
var cc_mongoPort = "27017";
var cc_contentDBName = "cc2_live";
var mimicURL = "https://www.dev.codecircle.gold.ac.uk/api/"
var cc_mongoUri = 'mongodb://'+cc_mongoIP+':'+cc_mongoPort+'/'+cc_contentDBName;
const Grid = require('gridfs');
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
      //console.log(result);
      //client.close();
    });
    var gfs = Grid(db, mongo);
    gfs.readFile({_id: "56bb1bb66764b91d000276f3"}, function (err, data) {
      if(err)
      {
        console.log(err)
      }
      console.log('read file %s: %s', "56bb1bb66764b91d000276f3");
    });
    // var source = './example.txt';
    // gfs.fromFile({filename: 'hello.txt'}, source, function (err, file) {
    //   console.log('saved %s to GridFS file %s', source, file._id);
    //   gfs.readFile({_id: file._id}, function (err, data) {
    //     console.log('read file %s: %s', file._id, data.toString());
    //   });
    // });
  }
});

transferDoc:function(docid, snapshot) {
  var doc = Documents.findOne(docid)
  console.log("transferring doc", docid, doc)
  console.log("snapshot", snapshot)
  console.log("calling POST doc")
  var docHTTP = new XMLHttpRequest();
  var data = {
    data : {
        attributes: {
          source: snapshot,
          ownerId: '476c9092-5d8a-747d-7089-9b4af31fddae',
          owner: 'codecircle',
          isPrivate: false,
          tags:doc.tags.push("written by " + docs.username),
          name:doc.title
      }
    }
  }
  docHTTP.onreadystatechange = async ()=> {
      if (docHTTP.readyState == 4 && docHTTP.status == 200)
      {
        console.log("success adding doc", JSON.parse(docHTTP.responseText).data.id)
        var newDocID = JSON.parse(docHTTP.responseText).data.id;
        var assets = DocAssets.find({'metadata.docid':docid}).fetch()
        var toUpload = [];
        var uploaded = 0;
        var target = assets.length;
        console.log("NUM ASSETS",assets.length)
        assets.forEach((file)=> {
          var assetHTTP = new XMLHttpRequest();
          var assetData = {
            url: 'http://localhost:3000'+file.url(),
            mimetype: file.original.type,
            name:file.original.name
          }
          assetHTTP.onreadystatechange = async ()=> {
            if (assetHTTP.readyState == 4 && assetHTTP.status == 200)
            {
                var uploadedAsset = JSON.parse(assetHTTP.responseText)
                console.log("success adding asset", )
                toUpload.push(uploadedAsset)
                uploaded++;
                if(uploaded == target)
                {
                  patchHTTP = new XMLHttpRequest();
                  var patchData = {
                    data : {
                      attributes: {
                        assets:toUpload
                      }
                    }
                  }
                  patchHTTP.onreadystatechange = async ()=> {
                    if (patchHTTP.readyState == 4 && patchHTTP.status == 200)
                    {
                      console.log("patch success")
                    }
                  }
                  patchHTTP.open("PATCH", 'http://localhost:8080/documents/' + newDocID, true);
                  patchHTTP.setRequestHeader("Content-Type", "application/json");
                  patchHTTP.send(JSON.stringify(patchData));
                }
            }
          }
          assetHTTP.open("POST", "http://localhost:8080/assetWithURL", true);
          assetHTTP.setRequestHeader("Content-Type", "application/json");
          assetHTTP.send(JSON.stringify(assetData));
        })
      }
  }

  docHTTP.open("POST", "http://localhost:8080/documents", true);
  docHTTP.setRequestHeader("Content-Type", "application/json");
  docHTTP.send(JSON.stringify(data));

},

var copyAsset = (asset)=> {
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
    console.log(file)
  });
}
