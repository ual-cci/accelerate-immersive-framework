process.env.NODE_ENV = 'test';

let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let server = require('../server');
let documentModel = require('../document-model');
let userModel = require('../user-model');
let userModelTest = require('./user-model');
let should = chai.should();
let expect = chai.expect();

chai.use(chaiHttp);

let token = "";
userModel.dropUsers();
documentModel.dropDocs();

describe('doc delete', () => {

  documentModel.dropDocs();

  let accountId = ""
  let docId = "";

  before((done)=> {
    userModel.newUser("test-user","somethingsecure","something@test.com")
    .then((res) => {
      console.log("made user", res);
      accountId = res.accountId
      userModelTest.getToken().then((t)=> {
        token = t;
        const public_attr = {
          isPrivate:false,
          name:"public-me",
          owner:"deleting-user",
          ownerId:"456",
          tags:["tag1", "tag2", "tag3", "tag4", "tag5"],
          forkedFrom:null,
          parent:null,
          source:"<html><head></head><body><script>console.log(\"hello world\")</script></body></html>"
        };
        documentModel.createDoc(public_attr).then((res)=>{
          docId = res.id;
          console.log("made document", docId, res.id)
          done();
        });
      });
    });
  });

  it('it should reject because no token', (done)=> {
    chai.request(server)
    .delete("/documents/"+docId)
    .then((res) => {
      res.should.have.status(401);
      done();
    });
  });

  it('it should delete the document and it should no longer return in searches', (done)=> {
    chai.request(server)
    .delete("/documents/"+docId)
    .set('Authorization', 'Bearer ' + token)
    .then((res) => {
      res.should.have.status(200);
      chai.request(server)
          .get('/documents')
          .query({filter:{search:"deleting-user", currentUser:"456", sortBy:"views", page: 0}})
          .end((err, res) => {
            res.should.have.status(200);
            console.log("search returned", res.body.data)
            assert.equal(res.body.data.length, 0);
            done();
          });
    });
  });

  after((done)=> {
    token = "";
    documentModel.removeDocs([docId]).then(()=> {
      userModel.dropTokens()
      userModel.dropUser(accountId).then(done());
    });
  })
})

describe('documents', () => {

  documentModel.dropDocs();
  let accountId = ""
  let docId = "";
  let docsAdded = [];

  const postDoc = (data)=> {
    return new Promise((resolve, reject)=> {
      chai.request(server)
      .post("/documents")
      .set('Authorization', 'Bearer ' + token)
      .send({data:{attributes:data}})
      .end((err, newDoc) => {
        if(err)
        {
          reject(err)
        }
        else
        {
          resolve(newDoc.body.data);
        }
      });
    });
  };

  before((done)=> {
    userModel.newUser("test-user","somethingsecure","something@test.com")
    .then((res) => {
      accountId = res.accountId
      userModelTest.getToken().then((t)=> {
        token = t;
        const public_attr = {
          isPrivate:false,
          name:"public-me",
          owner:"test-user",
          ownerId:"456",
          tags:["tag1", "tag2", "tag3", "tag4", "tag5"],
          forkedFrom:null,
          parent:null,
          source:"<html><head></head><body><script>console.log(\"hello world\")</script></body></html>"
        };
        const public_attr_2 = {
          isPrivate:false,
          name:"more-tags",
          owner:"test-user",
          ownerId:"456",
          tags:["tag1", "tag2", "tag3"],
          forkedFrom:null,
          parent:null,
          source:"<html><head></head><body><script>console.log(\"hello world\")</script></body></html>"
        };
        const private_attr = {
          isPrivate:true,
          name:"private-me",
          owner:"test-user",
          ownerId:"456",
          tags:["private_tag1", "private_tag2", "private_tag3",  "private_tag4",  "private_tag5"],
          forkedFrom:null,
          parent:null,
          source:"<html><head></head><body><script>console.log(\"hello world\")</script></body></html>"
        };
        const private_not_owned_attr = {
          isPrivate:true,
          name:"private-not-me",
          owner:"test-user-not-me",
          ownerId:"123",
          tags:["private_tag1", "private_tag2", "private_tag3",  "private_tag4",  "private_tag5"],
          forkedFrom:null,
          parent:null,
          source:"<html><head></head><body><script>console.log(\"hello world\")</script></body></html>"
        };
        const private_not_owned_attr2 = {
          isPrivate:true,
          name:"private-not-me",
          owner:"test-user-not-me",
          ownerId:"123",
          tags:["private_tag1", "private_tag2", "private_tag3",  "private_tag4",  "private_tag5"],
          forkedFrom:null,
          parent:null,
          source:"<html><head></head><body><script>console.log(\"hello world\")</script></body></html>"
        };
        const public_not_owned_attr = {
          isPrivate:false,
          name:"public-not-me",
          owner:"test-user-not-me",
          ownerId:"123",
          tags:["tag1", "tag2","tag3", "tag4", "tag5","tag6", "tag7","tag8", "tag9", "tag10"],
          forkedFrom:null,
          parent:null,
          source:"<html><head></head><body><script>console.log(\"hello world\")</script></body></html>"
        };
        const actions = [
          postDoc(public_attr),
          postDoc(public_attr_2),
          postDoc(private_attr),
          postDoc(private_not_owned_attr),
          postDoc(public_not_owned_attr),
          postDoc(private_not_owned_attr2)
        ];
        Promise.all(actions).then((vals)=> {
          docsAdded = vals.map((doc)=>{return doc.id})
          console.log(docsAdded);
          done();
        });
      });
    });
  });

  describe('/GET documents for user', () => {
      it('it should GET all the public documents, and documents owned by test-user', (done) => {
        chai.request(server)
            .get('/documents')
            .query({filter:{search:" ", currentUser:"456", sortBy:"views", page: 0}})
            .end((err, res) => {
              //assert.equal(3, res.body.data.length);
              let names = [];
              res.body.data.forEach((doc)=> {
                console.log(doc.attributes)
                if(doc.attributes.owner !== 'test-user')
                {
                  assert.isFalse(doc.attributes.isPrivate);
                }
                names.push(doc.attributes.name);
              });
              console.log("fetching", names);
              assert.isTrue(names.includes("public-me"));
              assert.isTrue(names.includes("more-tags"));
              assert.isTrue(names.includes("private-me"));
              assert.isTrue(names.includes("public-not-me"));
              assert.isFalse(names.includes("private-not-me"));
              res.should.have.status(200);
              done();
            });
      });
  });

  describe('/GET documents no user', () => {
      it('it should GET all the public documents, and nothing else', (done) => {
        chai.request(server)
            .get('/documents')
            .query({filter:{search:" ", currentUser:"", sortBy:"views", page: 0}})
            .end((err, res) => {
              let names = [];
              res.body.data.forEach((doc)=> {
                assert.isFalse(doc.attributes.isPrivate);
              });
              res.should.have.status(200);
              done();
            });
      });
  });

  describe('/GET tags', () => {
      it('it should GET the five most popular public tags', (done) => {
        chai.request(server)
            .get('/tags')
            .query({limit:5})
            .end((err, res) => {
              console.log(res.body.data);
              assert.equal(res.body.data.length, 5);
              const tags = res.body.data.map((t)=> {return t._id});
              assert.isTrue(tags.includes('tag1'));
              assert.isTrue(tags.includes('tag2'));
              assert.isTrue(tags.includes('tag3'));
              assert.isTrue(tags.includes('tag4'));
              assert.isTrue(tags.includes('tag5'));
              res.should.have.status(200);
              done();
            });
      });
  });

  describe('/GET tags different number', () => {
      it('it should GET the three most popular public tags', (done) => {
        chai.request(server)
            .get('/tags')
            .query({limit:3})
            .end((err, res) => {
              console.log(res.body.data);
              assert.equal(res.body.data.length, 3);
              const tags = res.body.data.map((t)=> {return t._id});
              assert.isTrue(tags.includes('tag1'));
              assert.isTrue(tags.includes('tag2'));
              assert.isTrue(tags.includes('tag3'));
              res.should.have.status(200);
              done();
            });
      });
  });

  describe('/PATCH doc', () => {
    it('it should patch the OWNER property of the doc', (done) => {
      chai.request(server)
      .patch("/documents/" + docsAdded[0])
      .send({data:{attributes:{owner:"new-owner"}}})
      .then((res) => {
        res.should.have.status(200);
        chai.request(server)
            .get('/documents')
            .query({filter:{search:"new-owner", currentUser:"456", sortBy:"views", page: 0}})
            .end((err, res) => {
              res.should.have.status(200);
              assert.equal(res.body.data[0].attributes.owner, "new-owner");
              done();
            });
      });
    });
  });

  describe('dont /PATCH source', () => {
    it('it should NOT patch the SOURCE property of the doc', (done) => {
      chai.request(server)
      .patch("/documents/" + docsAdded[0])
      .send({data:{attributes:{source:"<new-code>"}}})
      .then((res) => {
        res.should.have.status(200);
        chai.request(server)
            .get('/documents')
            .query({filter:{search:"public-me", currentUser:"456", sortBy:"views", page: 0}})
            .end((err, res) => {
              res.should.have.status(200);
              assert.equal(res.body.data.length, 1);
              assert.equal(res.body.data[0].attributes.source, "<html><head></head><body><script>console.log(\"hello world\")</script></body></html>");
              done();
            });
      });
    });
  });

  describe('dont /PATCH documentID', () => {
    it('it should NOT patch the SOURCE property of the doc', (done) => {
      chai.request(server)
      .patch("/documents/" + docsAdded[0])
      .send({data:{attributes:{documentId:"1239209580394810"}}})
      .then((res) => {
        res.should.have.status(200);
        chai.request(server)
            .get('/documents')
            .query({filter:{search:"public-me", currentUser:"456", sortBy:"views", page: 0}})
            .end((err, res) => {
              res.should.have.status(200);
              assert.equal(res.body.data.length, 1);
              assert.equal(res.body.data[0].attributes.documentId, docsAdded[0]);
              done();
            });
      });
    });
  });

  describe('users can flag docs only once', () => {
    before((done)=> {
      userModelTest.getToken().then((t)=> {
        token = t;
        done()
      })
    });

    it('it should reject because no token', (done) => {
      chai.request(server)
      .get("/flagDoc/?documentId=" + docsAdded[0] + "&user=test-user")
      .then((res) => {
        res.should.have.status(401);
        done();
      });
    });

    it('user should be able to flag a doc once, and ONLY once', (done) => {
      chai.request(server)
      .get("/flagDoc/?documentId=" + docsAdded[0] + "&user=test-user")
      .set('Authorization', 'Bearer ' + token)
      .then((res) => {
        res.should.have.status(200);
        chai.request(server)
          .get("/flagDoc/?documentId=" + docsAdded[0] + "&user=test-user")
          .set('Authorization', 'Bearer ' + token)
          .end((err,res) => {
            res.should.have.status(400);
            done();
          });
      });
    });

    after((done)=> {
      token = "";
      userModel.dropTokens()
      done();
    })

  });

  describe('/POST library', () => {
    before((done)=> {
      userModelTest.getToken().then((t)=> {
        token = t;
        done()
      })
    });

    it('it should reject because no token', (done)=> {
      chai.request(server)
      .post("/library")
      .send({data:{lib:"mmll", documentId:docsAdded[0]}})
      .end((err, res) => {
        res.should.have.status(401);
        done();
      });
    });

    it('it should insert script tag linking to library', (done)=> {
      chai.request(server)
      .post("/library")
      .set('Authorization', 'Bearer ' + token)
      .send({data:{lib:"mmll", documentId:docsAdded[0]}})
      .end((err, res) => {
        res.should.have.status(200);
        chai.request(server)
          .get("/documents/" + docsAdded[0])
          .then((res) => {
            const newSource = res.body.data.attributes.source;
            res.should.have.status(200);
            assert.equal(newSource, '<html><head>\n <script src = "https://mimicproject.com/libs/MMLL.js"></script></head><body><script>console.log("hello world")</script></body></html>')
            done();
          }).catch((err)=>{
            console.log("ERROR", err)
          });
      });
    });

    after((done)=> {
      token = "";
      userModel.dropTokens()
      done();
    })
  });

  describe('/POST op', () => {
    before((done)=> {
      userModelTest.getToken().then((t)=> {
        token = t;
        done()
      })
    });

    it('it should reject because no token', (done)=> {
      chai.request(server)
      .post("/submitOp")
      .send({op:{p: ["source", 0], si: "test"}, documentId:docsAdded[0]})
      .end((err, res) => {
        console.log(err, res.status);
        res.should.have.status(401);
        done();
      });
    });

    it('it should POST op if authorised', (done)=> {
      chai.request(server)
      .post("/submitOp")
      .set('Authorization', 'Bearer ' + token)
      .send({op:{p: ["source", 0], si: "test"}, documentId:docsAdded[0]})
      .end((err, res) => {
        console.log(err, res.status);
        res.should.have.status(200);
        done();
      });
    });

    after((done)=> {
      token = "";
      userModel.dropTokens()
      done();
    })
  });

  describe('/POST asset then retrieve using docid/filename', () => {
    before((done)=> {
      userModelTest.getToken().then((t)=> {
        token = t;
        chai.request(server)
        .post("/assetWithURL")
        .set('Authorization', 'Bearer ' + token)
        .send({mimetype:"audio/x-wav",name:"bear.wav", url:"http://www.wavsource.com/snds_2018-06-03_5106726768923853/animals/bear_growl_y.wav"})
        .end((err, res) => {
          let assetID = res.body.fileId;
          chai.request(server)
          .patch("/documents/" + docsAdded[0])
          .send({data:{attributes:{assets:[{'name':"bear.wav","fileId":assetID,fileType:"audio/x-wav"}]}}})
          .then((res) => {
            done();
          });
        });
      })
    });

    it('it should return 404 with bad docID', (done)=> {
      chai.request(server)
      .get("/asset/" + "this-is-not-as-id" + "/bear.wav")
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        console.log("asset", err, res.status);
        res.should.have.status(404);
        done();
      });
    });

    it('it should return 404 with bad filename', (done)=> {
      chai.request(server)
      .get("/asset/" + docsAdded[0] + "/this-is-not-a-filename.type")
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        console.log("asset", err, res.status);
        res.should.have.status(404);
        done();
      });
    });

    it('it should return an asset and 200', (done)=> {
      chai.request(server)
      .get("/asset/" + docsAdded[0] + "/bear.wav")
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        console.log("asset", err, res.status);
        res.should.have.status(200);
        done();
      });
    });

    after((done)=> {
      token = "";
      userModel.dropTokens()
      documentModel.dropAssets()
      done();
    })
  });

  describe('/POST asset from URL then delete', () => {
    before((done)=> {
      userModelTest.getToken().then((t)=> {
        token = t;
        done()
      })
    });

    it('it should reject because no token', (done)=> {
      chai.request(server)
      .post("/assetWithURL")
      .send({mimetype:"audio/x-wav",name:"bear", url:"http://www.wavsource.com/snds_2018-06-03_5106726768923853/animals/bear_growl_y.wav"})
      .end((err, res) => {
        console.log(err, res.status);
        res.should.have.status(401);
        done();
      });
    });

    let assetURL = "";
    it('it should return an asset ID and 200', (done)=> {
      chai.request(server)
      .post("/assetWithURL")
      .set('Authorization', 'Bearer ' + token)
      .send({mimetype:"audio/x-wav",name:"bear", url:"http://www.wavsource.com/snds_2018-06-03_5106726768923853/animals/bear_growl_y.wav"})
      .end((err, res) => {
        console.log(err, res.status);
        res.should.have.status(200);
        assert.equal(res.body.name, "bear")
        let assetID = res.body.fileId;
        const assets = [{name:"bear", fileId:assetID, fileType:"audio/x-wav"}];
        chai.request(server)
        .patch("/documents/" + docsAdded[0])
        .send({data:{attributes:{assets:assets}}})
        .end((err, res) => {
          assetURL = "/asset/"+docsAdded[0]+"/"+ "bear";
          done();
        });
      });
    });

    it('it should return an asset read stream', (done)=> {
      chai.request(server)
      .get(assetURL)
      .end((err, res) => {
        console.log(err, res.status);
        res.should.have.status(200);
        done();
      });
    });

    it('it should delete asset', (done)=> {
      chai.request(server)
      .delete(assetURL)
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        console.log(err, res.status);
        res.should.have.status(200);
        done();
      });
    });

    after((done)=> {
      token = "";
      userModel.dropTokens()
      documentModel.dropAssets()
      done();
    })
  });

  describe('Fork a document that has assets and appropriate non-duplication management', () => {
    before((done)=> {
      userModelTest.getToken().then((t)=> {
        token = t;
        done()
      })
    });

    let assetURL = "";
    let newDocID;

    it('it should copy the fileIDS from the original document', (done)=> {
      chai.request(server)
      .post("/assetWithURL")
      .set('Authorization', 'Bearer ' + token)
      .send({mimetype:"audio/x-wav",name:"bear", url:"http://www.wavsource.com/snds_2018-06-03_5106726768923853/animals/bear_growl_y.wav"})
      .end((err, res) => {
        res.should.have.status(200);
        let assetID = res.body.fileId;
        const assets = [{name:"bear", fileId:assetID, fileType:"audio/x-wav"}];
        //Update assets property
        chai.request(server)
        .patch("/documents/" + docsAdded[0])
        .send({data:{attributes:{assets:assets}}})
        .end((err, res) => {
          console.log(err, res.status);
          res.should.have.status(200);
          const forker = {data:{attributes:{
            isPrivate:false,
            name:"public-me",
            owner:"asset-user",
            ownerId:"456",
            tags:["tag1", "tag2", "tag3", "tag4", "tag5"],
            forkedFrom:docsAdded[0],
            parent:null,
            assets:assets,
            source:"<html><head></head><body><script>console.log(\"hello world\")</script></body></html>"
          }}};
          chai.request(server)
          .post("/documents")
          .set('Authorization', 'Bearer ' + token)
          .send(forker)
          .end((err, newDoc) => {
            newDocID = newDoc.body.data.id;
            const attr = newDoc.body.data.attr;
            //console.log(attr, err);
            console.log("assets from new doc", attr.assets);
            assert.equal(attr.assets[0].fileId, assets[0].fileId);
            assert.equal(attr.assets[0].name, assets[0].name);
            assert.equal(attr.assets[0].fileType, assets[0].fileType);
            assetURL = "/asset/" + newDocID + "/bear";
            chai.request(server)
            .get(assetURL)
            .end((err, res) => {
              console.log(err, res.status);
              res.should.have.status(200);
              done();
            });
          });
        });
      });
    });

    it('it should not delete asset from gridFS, but should from document record', (done)=> {
      chai.request(server)
      .delete("/asset/" + newDocID + "/bear")
      .set('Authorization', 'Bearer ' + token)
      .end((err, res) => {
        res.should.have.status(200);
        assert.equal(res.body.action, "not deleted, in use by others");
        chai.request(server)
        .patch("/documents/" + newDocID)
        .send({data:{attributes:{assets:[]}}})
        .end((err, res) => {
          chai.request(server)
          .delete("/asset/" + docsAdded[0] + "/bear")
          .set('Authorization', 'Bearer ' + token)
          .end((err, res) => {
            res.should.have.status(200);
            assert.equal(res.body.action, "deleted");
            chai.request(server)
            .patch("/documents/" + docsAdded[0])
            .send({data:{attributes:{assets:[]}}})
            .end((err, res) => {
              done();
            });
          });
        });
      });
    });

    after((done)=> {
      token = "";
      userModel.dropTokens()
      documentModel.dropAssets()
      done();
    })
  });

  after((done)=> {
    documentModel.removeDocs(docsAdded).then(()=> {
      console.log("did remove ", docsAdded)
      userModel.dropUser(accountId).then(()=>{done()});
    }).catch((err)=> {console.log(err)})
  });
});
