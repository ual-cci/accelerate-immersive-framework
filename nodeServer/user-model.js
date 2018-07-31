var oauthserver = require('oauth2-server');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var bodyParser = require('body-parser');
const guid = require('./uuid.js');
let clientModel = require('./mongo/model/client');
let	tokenModel = require('./mongo/model/token');
let	userModel = require('./mongo/model/user');
var bcrypt = require('bcrypt');
var OAuthError = require('oauth2-server/lib/error');
var mongoIP = "";
var mongoPort = "";
var oauthDBName = "";
const saltRounds = 10;

//AUTH

var getAccessToken = function(bearerToken, callback) {
	tokenModel.findOne({
		accessToken: bearerToken
	}, function(err, token) {
		callback(err, token);
	});
};

var getClient = function(clientId, clientSecret, callback) {
	clientModel.findOne({
		clientId: clientId,
		clientSecret: clientSecret
	}, callback);
};

var grantTypeAllowed = function(clientId, grantType, callback) {
	callback(false, grantType === "password");
};

var saveAccessToken = function(accessToken, clientId, expires, user, callback) {
	var token = new tokenModel({
		accessToken: accessToken,
		expires: expires,
		clientId: clientId,
		user: user
	});
	token.save(callback);
};

var getUser = function(username, password, callback) {
	userModel.findOne({
		username: username
	}, (err, user) => {
		if(err || !user)
		{
			callback(err);
			return;
		}
		var hash = user.password;
		bcrypt.compare(password, hash).then((res) => {
			if(res)
			{
				callback(err, user);
			}
			else
			{
				callback();
			}
		});
	});
};

const model = {
	getAccessToken: getAccessToken,
	getClient: getClient,
	grantTypeAllowed: grantTypeAllowed,
	saveAccessToken: saveAccessToken,
	getUser: getUser
}

//API

var initUserAPI = function(app, config)
{
	mongoIP = config.mongoIP;
  mongoPort = config.mongoPort;
	oauthDBName = config.oauthDBName;
	startAuthAPI(app);
}

var initErrorHandling = function(app)
{
	app.use(function (err, req, res, next) {
		if (err instanceof OAuthError)
		next(err);
	});

	app.use(app.oauth.errorHandler());
}

function startAuthAPI(app)
{
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
  app.use(bodyParser.json());

  var mongoUri = 'mongodb://' + mongoIP +'/' + oauthDBName;
  mongoose.connect(mongoUri, { useMongoClient: true }, function(err, res) {
    if (err) {
      return console.error('Error connecting to "%s":', mongoUri, err);
    }
    console.log('Connected successfully to "%s"', mongoUri);
    setup();
  });

  app.oauth = oauthserver({
    model: model,
    grants: ['password'],
    debug: false
  });

  app.all('/oauth/token', app.oauth.grant());

  app.post('/accounts', function (req, res) {
    let attr = req.body.data.attributes;
    newUser(attr.username,attr.password,attr.email)
    .then( (user) => {
      res.type('application/vnd.api+json');
      res.status(200);
      var json = {data:{id:user.accountId,type:'account',attr:user}};
      res.json(json);
    })
    .catch( (err) =>  res.status(400).send(err));
  });

  app.post('/resetPassword', function(req,res) {
    requestPasswordReset(req.body.username)
    .then( (user) => {
      console.log('success reset');
      res.status(200).send({link:"/password-reset?username="+user.username+"&token="+user.passwordResetToken})
    })
    .catch( (err) =>  {
      console.log('failed reset');
      res.status(400).send(err)});
  });

  app.post('/checkPasswordToken', function(req,res) {
    checkPasswordToken(req.body.username, req.body.token)
    .then( () => {
      res.sendStatus(200);
    })
    .catch( (err) =>  {
      res.status(400).send(err);
    });
  });

  app.post('/updatePassword', (req,res)=> {
    updatePassword(req.body.username, req.body.token, req.body.password)
    .then( () => {
      res.sendStatus(200);
    })
    .catch( (err) =>  {
      res.status(400).send(err);
    });
  });

	app.get('/canFlag', app.oauth.authorise(), (req, res) => {
		const username = req.query.user;
		const doc = req.query.documentId;
		userModel.findOne({
			username: username
		}, (err, user) => {
			if(err)
			{
				res.status(400).send(err);
			}
			else
			{
				flagged = user.flaggedDocs;
				if(flagged.includes(doc))
				{
					res.status(400).send("already flagged");
				}
				else
				{
					flagged.push(doc);
					user.set('flaggedDocs', flagged);
					user.save((err, user) => {
						if(err)
						{
							res.status(400).send();
						}
						else {
							res.status(200).send();
						}
					});
				}
			}
		});
	})
}

var setup = function() {
	clientModel.find({clientId:"application"}, (err, client) => {
		if(client.length < 1)
		{
			var client = new clientModel({clientId:"application", clientSecret:"secret"});
			client.save((err, client) => console.log("saved client"));
		}
	});
}

//METHODS

var newUser = function(username, password, email) {
	return new Promise((resolve, reject) => {
		userModel.find({username:username}, function(err,user) {
			if(user.length > 0 || err)
			{
				reject("user already exists");
				return;
			}
			userModel.count({}, (err, c) => {
				bcrypt.hash(password, saltRounds).then((hash) => {
					getNewUserId((accountId) => {
						var user = new userModel({
							accountId: accountId,
							username: username,
							password: hash,
							email: email,
							created:new Date()
						});
						user.save((err, user) => {
							if (err) {
								reject("internal error creating user");
								return;
							}
							resolve(user);
							return;
						});
					});
				});
			});
		});
	});
};

var getNewUserId = function(callback)
{
	var uuid = guid.guid();
	userModel.find({accountId:uuid}, function(err,user) {
		if(user.length > 0 || err) {
			console.log("collision, generating again");
			getNewUserId(callback);
		}
		else
		{
			callback(uuid);
		}
	});
}

var updatePassword = function(username, token, password)
{
	return new Promise((resolve, reject) => {
		checkPasswordToken(username, token)
		.then((user) => {
			console.log(username, password, saltRounds);
			bcrypt.hash(password, saltRounds).then((hash) => {
				user.set('password', hash);
				user.set('passwordResetToken', null);
				user.set('passwordResetExpiry', new Date());
				user.save((err, user) => {
					if(err)
					{
						reject("error saving user");
						return;
					}
					else {
						resolve();
						return;
					}
				});
			}).catch((err) => {
				console.log(err);
				reject("error salting");
			});
		}).catch((err) => {
			reject("token bad");
		});
	});
}

var checkPasswordToken = function(username, token)
{
	return new Promise((resolve, reject) => {
		userModel.find({username:username}, function(err,users) {
			if(users.length>0 && !err)
			{
				var user = users[0];
				if(token != user.passwordResetToken)
				{
					reject();
				}
				else if (new Date() > user.passwordResetExpiry)
				{
					reject();
				}
				resolve(user);
			}
			else
			{
				reject();
			}
		});
	});
}

var requestPasswordReset = function(username) {
	return new Promise((resolve, reject) => {
		userModel.find({username:username}, function(err,users) {
			if(users.length>0 && !err)
			{
				var user = users[0];
				user.passwordResetToken = guid.guid();
				var tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				user.passwordResetExpiry = tomorrow;
				user.save((err, user) => {
					if(err)
					{
						reject(err);
						return;
					}
					else {
						resolve(user);
						return;
					}
				});
			}
			else
			{
				reject(err);
				return;
			}
		});
	})
}


module.exports = {
	initUserAPI:initUserAPI,
	initErrorHandling:initErrorHandling
};

//HELPER

var dropUsers = function() {
	userModel.remove({},function(err){console.log('cleared all users')});
}

var dropTokens = function() {
	tokenModel.remove({},function(err){console.log('cleared all tokens')});
}

var dump = function() {
	clientModel.find(function(err, clients) {
		if (err) {
			return console.error(err);
		}
		console.log('clients', clients);
	});
	tokenModel.find(function(err, tokens) {
		if (err) {
			return console.error(err);
		}
		console.log('tokens', tokens);
	});
	userModel.find(function(err, users) {

		if (err) {
			return console.error(err);
		}
		console.log('users', users);
	});
};
//dump();
// dropUsers();
// dropTokens();
