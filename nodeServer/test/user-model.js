process.env.NODE_ENV = 'test';

let chai = require('chai');
let assert = chai.assert;
let chaiHttp = require('chai-http');
let server = require('../server');
let userModel = require('../user-model');
let should = chai.should();

chai.use(chaiHttp);
// 
// describe('users', () => {
//   beforeEach((done) => {
//     userModel.dropUsers().then(()=>{
//       done();
//     });
//   });
//
//   describe('/GET users', () => {
//       it('it should GET all the users', (done) => {
//         chai.request(server)
//             .get('/accounts')
//             .end((err, res) => {
//               console.log(res);
//               //assert.isTrue(names.includes("public-me"));
//               res.should.have.status(200);
//               done();
//             });
//       });
//   });
// });
