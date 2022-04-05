const OAuth2Server = require('express-oauth-server');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var Schema = mongoose.Schema;
var bodyParser = require('body-parser');
const guid = require('./uuid.js');
var bcrypt = require('bcrypt');
var nodemailer = require('nodemailer')
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
  passwordResetExpiry: {type: Date},
  flaggedDocs: {type:[String]}
}));

var OAuthTokensModel = mongoose.model('token');
var OAuthClientsModel = mongoose.model('client');
var OAuthUsersModel = mongoose.model('user');

let model = {};
model.getAccessToken = function(bearerToken) {
	return new Promise ((resolve, reject) => {
	  OAuthTokensModel.findOne({ accessToken: bearerToken },
		(err, token) => {
			if(err || !token) {
				reject(err);
			}
			else
			{
				resolve(token)
			}
		});
	});
};

model.getClient = function(clientId, clientSecret) {
	//console.log("getting Client");
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
				//console.log("got client");
				resolve(client)
			}
		});
	});
};

model.getRefreshToken = function(refreshToken) {
	//console.log("get refresh token");
  return OAuthTokensModel.findOne({ refreshToken: refreshToken }).lean();
};

model.getUser = function(username, password) {
	console.log('getting user')
  username = username.toLowerCase();
  return new Promise((resolve, reject)=> {
    OAuthUsersModel.findOne({ username: username},
      (err, user) => {
      if(err || !user)
      {
        console.log("user not found", err);
        reject("user not found");
        return;
      }
      var hash = user.password;
      bcrypt.compare(password, hash).then((res) => {
        if(res)
        {
          console.log("passwords match")
          resolve(user);
					return;
        }
        else
        {
          console.log("password not correct", err);
          reject("password not correct");
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
	//console.log("save token");
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

var initUserAPI = function(app, uri)
{
  mongoUri = uri;
	startAuthAPI(app);
}

function startAuthAPI(app)
{
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
  app.use(bodyParser.json());

  mongoose.connect(mongoUri, function(err, res) {
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
    const username = req.query.username.toLowerCase();
    console.log("find user", username);
    OAuthUsersModel.find({username:username}, function(err,users) {
      console.log("returned user", err);
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
      else
      {
        res.status(400).send("server error fetching user");
      }
    });
  });

  app.post('/accounts', function (req, res) {
    console.log("new user", req.body.data.attributes);
    let attr = req.body.data.attributes;
    const username = attr.username.toLowerCase();
    newUser(username,attr.password,attr.email)
    .then( (user) => {
      res.type('application/vnd.api+json');
      res.status(200);
      var json = {data:{id:user.id,type:'account',attr:user}};
      res.json(json);
    })
    .catch( (err) =>  res.status(400).send(err));
  });

  app.post('/resetPassword', function(req,res) {
    let username = req.body.username.toLowerCase();
    requestPasswordReset(username)
    .then( (user) => {
      username = user.username.toLowerCase();
      console.log('success reset', "/password-reset?username="+username+"&token="+user.passwordResetToken);
      if(!req.body.test)
      {
        sendResetEmail(user.email, req.body.hostURL + "/password-reset?username="+username+"&token="+user.passwordResetToken)
      }
      res.status(200).send()
    })
    .catch( (err) =>  {
      console.log('failed reset');
      res.status(400).send(err)});
  });

  app.post('/checkPasswordToken', function(req,res) {
    console.log("checking password token")
    let username = req.body.username.toLowerCase();
    checkPasswordToken(username, req.body.token)
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
    let username = req.body.username.toLowerCase();
    updatePassword(username, req.body.token, req.body.password)
    .then( () => {
      res.sendStatus(200);
    })
    .catch( (err) =>  {
      res.status(400).send(err);
    });
  });

	app.get('/flagDoc', app.oauth.authenticate(), (req, res) => {
		const username = req.query.user.toLowerCase();
		const doc = req.query.documentId;
    console.log("flag doc", req.query)
		OAuthUsersModel.findOne({
			username: username
		}, (err, user) => {
      console.log(err, user)
			if(err || !user)
			{
				res.status(400).send(err);
			}
			else
			{
        console.log(user);
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
			if(user && (user.length > 0 || err))
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
              //console.log("CREATED USER",user, savedUser);
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

var dropTokens = async function() {
	OAuthTokensModel.remove({},function(err){
    console.log('cleared all tokens')
    return err;
  });
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
	initUserAPI:initUserAPI,
};

if(process.env.NODE_ENV == "test") {
  module.exports.dropTokens = dropTokens;
  module.exports.dropUser = dropUser;
  module.exports.dropUsers = dropUsers;
}
