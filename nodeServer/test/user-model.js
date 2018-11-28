process.env.NODE_ENV = 'test';

let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let server = require('../server');
let userModel = require('../user-model');
let should = chai.should();

chai.use(chaiHttp);

describe('users', () => {
  beforeEach((done) => {
    done();
  });

  afterEach((done) => {
    done();
  });

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
});
