const OAuth2Server = require('express-oauth-server');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;
var bodyParser = require('body-parser');
const guid = require('./uuid.js');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer')
var mongoIP = "";
var mongoPort = "";
var oauthDBName = "";
var replicaSet = "";
var siteURL = "";
const saltRounds = 10;

//AUTH

mongoose.model('token', new Schema({
  accessToken: { type: String },
  accessTokenExpiresAt: { type: Date },
  client : { type: Object },
  clientId: { type: String },
  refreshToken: { type: String },
  refreshTokenExpiresAt: { type: Date },
  user : { type: Object },
  userId: { type: String },
}));

mongoose.model('client', new Schema({
  clientId: { type: String },
  clientSecret: { type: String },
  redirectUris: { type: Array },
	grants: {type: Array}
}));

mongoose.model('user', new Schema({
  email: { type: String, default: '' },
  firstname: { type: String },
  lastname: { type: String },
  password: { type: String },
  username: { type: String },
  accountId: {type: String},
  created: {type: Date},
  passwordResetToken: {type: String},
  passwordResetExpiry: {type: Date}
}));

var OAuthTokensModel = mongoose.model('token');
var OAuthClientsModel = mongoose.model('client');
var OAuthUsersModel = mongoose.model('user');

let model = {};
model.getAccessToken = function(bearerToken) {
	console.log("getAccessToken", bearerToken);
	return new Promise ((resolve, reject) => {
	  OAuthTokensModel.findOne({ accessToken: bearerToken },
		(err, token) => {
			if(err || !token) {
        console.log("error fetching token", token);
				reject(err);
			}
			else
			{
				console.log("got token", token);
				resolve(token)
			}
		});
	});
};

model.getClient = function(clientId, clientSecret) {
	console.log("getting Client");
  return new Promise ((resolve, reject) => {
		OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret },
		(err, client) => {
			if(err) {
				reject(err);
			}
			else {
				const c = {
	        id: client.id,
	        grants: ["password"]
      	};
				console.log("got client");
				resolve(client)
			}
		});
	});
};

model.getRefreshToken = function(refreshToken) {
	console.log("get refresh token");
  return OAuthTokensModel.findOne({ refreshToken: refreshToken }).lean();
};

model.getUser = function(username, password) {
	console.log('getting user')
  return new Promise((resolve, reject)=> {
    OAuthUsersModel.findOne({ username: username},
      (err, user) => {
      if(err || !user)
      {
				console.log('ERROR getting user')
        reject(err);
        return;
      }
      var hash = user.password;
      bcrypt.compare(password, hash).then((res) => {
        if(res)
        {
					console.log('got user', user)
          resolve(user);
					return;
        }
        else
        {
					console.log('ERROR getting user')
          reject(err);
					return;
        }
      });
    });
  })
};

model.saveToken = function(token, client, user) {
  var accessToken = new OAuthTokensModel({
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    client : client,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    user : user,
    userId: user._id,
  });
	console.log("save token", token, accessToken);
  // Can't just chain `lean()` to `save()` as we did with `findOne()` elsewhere. Instead we use `Promise` to resolve the data.
  return new Promise( function(resolve,reject){
    accessToken.save(function(err,data){
      if( err ) reject( err );
      else resolve( data );
    }) ;
  }).then(function(saveResult){
    // `saveResult` is mongoose wrapper object, not doc itself. Calling `toJSON()` returns the doc.
    saveResult = saveResult && typeof saveResult == 'object' ? saveResult.toJSON() : saveResult;

    // Unsure what else points to `saveResult` in oauth2-server, making copy to be safe
    var data = new Object();
    for( var prop in saveResult ) data[prop] = saveResult[prop];

    // /oauth-server/lib/models/token-model.js complains if missing `client` and `user`. Creating missing properties.
    data.client = data.clientId;
    data.user = data.userId;

    return data;
  });
};

//API

var initUserAPI = function(app, config)
{
	mongoIP = config.mongoIP;
  mongoPort = config.mongoPort;
	oauthDBName = process.env.NODE_ENV == "test" ? config.test_oauthDBName : config.oauthDBName;
  console.log("USER DB", oauthDBName);
  replicaSet = config.replicaSet;
  siteURL = config.siteURL;
	startAuthAPI(app);
}

function startAuthAPI(app)
{
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
  app.use(bodyParser.json());

  var mongoUri = 'mongodb://' + mongoIP + ":" + mongoPort +'/' + oauthDBName;
  if(replicaSet)
  {
    mongoUri = mongoUri + '?replicaSet='+replicaSet;
  }
  console.log(mongoUri);
  mongoose.connect(mongoUri, { useMongoClient: true }, function(err, res) {
    if (err) {


      return console.error('USER MODEL - Error connecting to "%s":', mongoUri, err);
    }
    console.log('Connected successfully to "%s"', mongoUri);
    setup();
  });

	app.oauth = new OAuth2Server({
	  debug: true,
	  model: model,
		allowBearerTokensInQueryString: true,
  	accessTokenLifetime: 1209600
	});

  app.all('/oauth/token', app.oauth.token());

  app.get('/accounts', function (req, res) {
    console.log("find user");
    OAuthUsersModel.find({username:req.query.username}, function(err,users) {
      console.log("found user", users.length,err);
			if(users.length > 0 && !err)
			{
        console.log("found user");
        let user = users[0];
        user.password = "";
        user.email = "";
        user.created = "";
        user._id = "";
        console.log(user);
				res.status(200).send({data:{id:user.accountId,type:'account',attr:user}})
				return;
			}
    });
  });

  app.post('/accounts', function (req, res) {
    console.log("new user", req.body.data.attributes);
    let attr = req.body.data.attributes;
    newUser(attr.username,attr.password,attr.email)
    .then( (user) => {
      res.type('application/vnd.api+json');
      res.status(200);
      var json = {data:{id:user.id,type:'account',attr:user}};
      res.json(json);
    })
    .catch( (err) =>  res.status(400).send(err));
  });

  app.post('/resetPassword', function(req,res) {
    requestPasswordReset(req.body.username)
    .then( (user) => {
      console.log('success reset', siteURL + "/password-reset?username="+user.username+"&token="+user.passwordResetToken);
      if(!req.body.test)
      {
        sendResetEmail(user.email, siteURL + "/password-reset?username="+user.username+"&token="+user.passwordResetToken)
      }
      res.status(200).send()
    })
    .catch( (err) =>  {
      console.log('failed reset');
      res.status(400).send(err)});
  });

  app.post('/checkPasswordToken', function(req,res) {
    console.log("checking password token")
    checkPasswordToken(req.body.username, req.body.token)
    .then( () => {
      console.log("token GOOD")
      res.sendStatus(200);
    })
    .catch( (err) =>  {
      console.log("token BAD")
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

	app.get('/canFlag', app.oauth.authenticate(), (req, res) => {
		const username = req.query.user;
		const doc = req.query.documentId;
		OAuthUsersModel.findOne({
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
	OAuthClientsModel.find({clientId:"application"}, (err, client) => {
    console.log(err, client);
		if(client.length < 1)
		{
			var client = new OAuthClientsModel({clientId:"application", clientSecret:"secret", grants:["password"]});
			client.save((err, client) => console.log("saved client"));
		}
	});
}

//METHODS

var newUser = function(username, password, email) {
	return new Promise((resolve, reject) => {
		OAuthUsersModel.find({username:username}, function(err, user) {
      console.log(err, user)
			if(user.length > 0 || err)
			{
				reject("user already exists");
				return;
			}
			OAuthUsersModel.count({}, (err, c) => {
				bcrypt.hash(password, saltRounds).then((hash) => {
					getNewUserId((accountId) => {
 						var user = new OAuthUsersModel({
							accountId: accountId,
							username: username,
							password: hash,
							email: email,
							created:new Date()
						});
						user.save((err, savedUser) => {
							if (err) {
								reject("internal error creating user");
								return;
							}
              c//onsole.log("CREATED USER",user, savedUser);
							resolve(savedUser);
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
	OAuthUsersModel.find({accountId:uuid}, function(err,user) {
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
    console.log("cheking for user")
		OAuthUsersModel.find({username:username}, function(err,users) {
      console.log(err,users)
			if(users.length>0 && !err)
			{
        var user = users[0];
				if(token != user.passwordResetToken)
				{
          console.log("tokens dont match")
					reject();
				}
				else if (new Date() > user.passwordResetExpiry)
				{
          console.log("token expired")
					reject();
				}
        console.log("token good")
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
		OAuthUsersModel.find({username:username}, function(err,users) {
			if(users.length>0 && !err)
			{
				var user = users[0];
        console.log(user)
        if(user.email == "")
        {
          reject("no email linked to account")
          return;
        }
				user.passwordResetToken = guid.guid();
        console.log("password reset token", user.passwordResetToken)
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

var sendResetEmail = (email, link)=> {
  let smtpConfig = {
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: 'l.mccallum@gold.ac.uk',
        pass: 'D48JXQByAC1ES3ac'
    }
  };
  let transporter = nodemailer.createTransport(smtpConfig)
  var message = {
      from: 'l.mccallum@gold.ac.uk',
      to: email,
      subject: 'Reset your MIMIC Password',
      text: 'Click this link ' + link,
      html: '<p>Click this link <a href=' + link + '>Reset your password</a></p>'
  };
  transporter.sendMail(message);
}

//HELPER

var dropUsers = ()=> {
  return new Promise((resolve, reject)=> {
    OAuthUsersModel.remove({},function(err){
      if (err)
      {
        reject();
      }
      else
      {
        resolve();
        console.log('cleared all users')
      }
    });
  });
}

const dropUser = (accountId)=>
{
  return new Promise((resolve, request)=> {
    OAuthUsersModel.remove({accountId:accountId}, function(err) {
      if(err) {
        reject(err)
      } else {
        resolve()
      }
    })
  });
}

var dropTokens = function() {
	OAuthTokensModel.remove({},function(err){console.log('cleared all tokens')});
}

var dump = function() {
	OAuthClientsModel.find(function(err, clients) {
		if (err) {
			return console.error(err);
		}
		console.log('clients', clients);
	});
	OAuthTokensModel.find(function(err, tokens) {
		if (err) {
			return console.error(err);
		}
		console.log('tokens', tokens);
	});
	OAuthUsersModel.find(function(err, users) {

		if (err) {
			return console.error(err);
		}
		console.log('users', users);
	});
};

module.exports = {
  newUser:newUser,
  dropUser:dropUser,
	initUserAPI:initUserAPI,
};
