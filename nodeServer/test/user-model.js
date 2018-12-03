process.env.NODE_ENV = 'test';

let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let server = require('../server');
let userModel = require('../user-model');
let should = chai.should();

chai.use(chaiHttp);

describe('users', () => {
  describe('/POST user', () => {
    let accountId;
    it('it should create a new user with no errors', (done) => {
      chai.request(server)
          .post('/accounts')
          .send({data:{attributes:{ username: 'test-user', password: 'somethingsecure', email:"something@test.com"}}})
          .end((err, res) => {
            console.log(res.body);
            assert.equal("test-user", res.body.data.attr.username)
            assert.exists(res.body.data.attr.created);
            assert.exists(res.body.data.attr.password);
            assert.exists(res.body.data.attr.accountId);
            accountId = res.body.data.attr.accountId;
            res.should.have.status(200);
            done();
          });
    });
    after((done)=> {
      userModel.dropUser(accountId).then(done);
    });
  });

  describe('/POST user same name', () => {
    let accountId;
    it('it should return 400 because the user name alreaedy exists', (done) => {
      chai.request(server)
          .post('/accounts')
          .send({data:{attributes:{ username: "test-user", password: "somethingsecure", email:"something@test.com"}}})
          .then((err, res) => {
            console.log(res.body);
            assert.equal("test-user", res.body.data.attr.username)
            assert.exists(res.body.data.attr.created);
            assert.exists(res.body.data.attr.password);
            assert.exists(res.body.data.attr.accountId);
            accountId = res.body.data.attr.accountId;
            res.should.have.status(200);
            done();
          }).then(()=> {
        chai.request(server)
            .post('/accounts')
            .send({data:{attributes:{ username: "test-user", password: "somethingsecure", email:"something@test.com"}}})
            .end((err, res) => {
              console.log(res.body);
              res.should.have.status(400);
              done();
            });
      });
    });
    after((done)=> {
      userModel.dropUser(accountId).then(done);
    });
  });

  describe('/GET user', () => {
    let accountId;
    before((done)=> {
      userModel.newUser("test-user","somethingsecure","something@test.com").then(done);
    });
    it('it should get the users ID from the name, and should NOT return passwords or emails', (done) => {
      chai.request(server)
          .get('/accounts')
          .query({ username: 'test-user', test: true})
          .end((err, res) => {
            console.log("GOT USER", res.body.data.attr);
            assert.equal("test-user", res.body.data.attr.username)
            assert.isNull(res.body.data.attr.created);
            assert.equal("", res.body.data.attr.password);
            assert.equal(accountId, res.body.data.attr.accountId);
            res.should.have.status(200);
            done();
          });
    });
    after((done)=> {
      userModel.dropUser(accountId).then(done);
    });
  });


});
