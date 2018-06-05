var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var oauthserver = require('oauth2-server');
var mongoose = require('mongoose');
var cors = require('express-cors');
var userAPI = require('./user-model.js');
var docAPI = require('./document-model.js');
var guid = require('./uuid.js');

const app = express();
startServer();

function startAuthAPI()
{
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
  app.use(bodyParser.json());

  var mongoUri = 'mongodb://localhost/oauth';
  mongoose.connect(mongoUri, function(err, res) {
    if (err) {
      return console.error('Error connecting to "%s":', mongoUri, err);
    }
    console.log('Connected successfully to "%s"', mongoUri);
    userAPI.init();
  });

  app.oauth = oauthserver({
    model: userAPI,
    grants: ['password'],
    debug: true
  });

  app.all('/oauth/token', app.oauth.grant());

  app.get('/', app.oauth.authorise(), function (req, res) {
    res.send('Congratulations, you are in a secret area!');
  });

  app.use(app.oauth.errorHandler());

  app.post('/accounts', function (req, res) {
    //console.log('request for new user', req.body);
    let attr = req.body.data.attributes;
    console.log(attr);
    userAPI.newUser(attr.username,attr.password,attr.email)
    .then( (user) => {
      res.type('application/vnd.api+json');
      res.status(200);
      console.log('resolved with user',user);
      var json = {data:{id:user.accountId,type:'account',attr:user}};
      res.json(json);
    })
    .catch( (err) =>  res.status(400).send(err));
  });

  app.post('/resetPassword', function(req,res) {
    console.log(req.body);
    userAPI.requestPasswordReset(req.body.username)
    .then( () => {
      console.log('success reset');
      res.sendStatus(200)
    })
    .catch( (err) =>  {
      console.log('failed reset');
      res.status(400).send(err)});
  });

  app.post('/checkPasswordToken', function(req,res) {
    console.log(req.body);
    userAPI.checkPasswordToken(req.body.username, req.body.token)
    .then( () => {
      console.log('token good');
      res.sendStatus(200);
    })
    .catch( (err) =>  {
      console.log('token bad');
      res.status(400).send(err);
    });
  });

  app.post('/updatePassword', function(req,res) {
    console.log(req.body);
    userAPI.updatePassword(req.body.username, req.body.token, req.body.password)
    .then( () => {
      console.log('successfuly updated');
      res.sendStatus(200);
    })
    .catch( (err) =>  {
      console.log('failed');
      res.status(400).send(err);
    });
  });
}

function startServer()
{
  app.use(express.static('static'));
  app.use(cors({
    allowedOrigins: [
        'http://localhost:4200'
    ],
    headers: ["Authorization", "Content-Type"]
  }));

  var server = http.createServer(app);

  startAuthAPI();
  docAPI.initDocAPI(server, app);
  
  server.listen(8080);
  console.log('Listening on http://localhost:8080');
}
