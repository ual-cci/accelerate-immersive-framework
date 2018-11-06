process.env.NODE_ENV = 'test';

let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let server = require('../server');
let documentModel = require('../document-model');
let should = chai.should();

chai.use(chaiHttp);

describe('documents', () => {
  beforeEach((done) => {
    documentModel.dropDocs(function(err){
      console.log('cleared all docs')
      const public_attr = {
        isPrivate:false,
        name:"public-me",
        owner:"test-user",
        tags:["tag1", "tag2", "tag3", "tag4", "tag5"],
        forkedFrom:null,
        parent:null,
        source:"<code>"
      };
      const private_attr = {
        isPrivate:true,
        name:"private-me",
        owner:"test-user",
        tags:["private_tag1", "private_tag2", "private_tag3",  "private_tag4",  "private_tag5"],
        forkedFrom:null,
        parent:null,
        source:"<code>"
      };
      const private_not_owned_attr = {
        isPrivate:true,
        name:"private-not-me",
        owner:"test-user-not-me",
        tags:["private_tag1", "private_tag2", "private_tag3",  "private_tag4",  "private_tag5"],
        forkedFrom:null,
        parent:null,
        source:"<code>"
      };
      const private_not_owned_attr2 = {
        isPrivate:true,
        name:"private-not-me",
        owner:"test-user-not-me",
        tags:["private_tag1", "private_tag2", "private_tag3",  "private_tag4",  "private_tag5"],
        forkedFrom:null,
        parent:null,
        source:"<code>"
      };
      const public_not_owned_attr = {
        isPrivate:false,
        name:"public-not-me",
        owner:"test-user-not-me",
        tags:["tag1", "tag2","tag3", "tag4", "tag5","tag6", "tag7","tag8", "tag9", "tag10"],
        forkedFrom:null,
        parent:null,
        source:"<code>"
      };
      const actions = [
        documentModel.createDoc(public_attr),
        documentModel.createDoc(private_attr),
        documentModel.createDoc(private_not_owned_attr),
        documentModel.createDoc(public_not_owned_attr),
        documentModel.createDoc(private_not_owned_attr2)
      ];
      Promise.all(actions).then((vals)=> {
        done();
      });
    });
  });

  describe('/GET documents', () => {
      it('it should GET all the public documents, and documents owned by test-user', (done) => {
        chai.request(server)
            .get('/documents')
            .query({filter:{search:" ", currentUser:"test-user", sortBy:"views", page: 0}})
            .end((err, res) => {
              assert.equal(res.body.data.length, 3);
              let names = [];
              res.body.data.forEach((doc)=> {
                if(doc.attributes.owner !== 'test-user')
                {
                  assert.isFalse(doc.attributes.isPrivate);
                }
                names.push(doc.attributes.name);
              });
              assert.isTrue(names.includes("public-me"));
              assert.isTrue(names.includes("private-me"));
              assert.isTrue(names.includes("public-not-me"));
              assert.isFalse(names.includes("private-not-me"));
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
});
