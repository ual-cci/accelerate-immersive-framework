var mongoose = require('mongoose');
const guid = require('./uuid.js');
let clientModel = require('./mongo/model/client');
let	tokenModel = require('./mongo/model/token');
let	userModel = require('./mongo/model/user');
var bcrypt = require('bcrypt');
const saltRounds = 10;

//API

var init = function() {
	console.log("checking client");
	clientModel.find({clientId:"application"}, (err, client) => {
		if(client.length < 1)
		{
			console.log("client doesnt exist, creating");
			var client = new clientModel({clientId:"application", clientSecret:"secret"});
			client.save((err, client) => console.log("saved client"));
		}
		else
		{
			console.log("client exists");
		}
	});
}

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
						console.log("making user");
						var user = new userModel({
							account_id: accountId,
							username: username,
							password: hash,
							email: email
						});
						user.save((err, user) => {
							if (err) {
								reject("internal error creating user");
									return;
							}
							resolve();
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
	console.log("uuid",uuid);
	userModel.find({account_id:uuid}, function(err,user) {
		if(user.length > 0 || err) {
			console.log("collision, generating again");
			getNewUserId(callback);
		}
		else
		{
			console.log("returning uuid");
			callback(uuid);
		}
	});
}

var requestPasswordReset = function(username) {
	console.log('requestPasswordReset');
	return new Promise((resolve, reject) => {
		userModel.find({username:username}, function(err,users) {
			if(users.length>0 && !err)
			{
				var user = users[0];
				console.log('found user',user);
				user.set('resetPasswordToken', guid.guid());
				var tomorrow = new Date();
				tomorrow.setDate(tomorrow.getDate() + 1);
				user.set('resetPasswordExpiry', tomorrow);
				console.log('updated user',user);
				user.save((err, user) => {
					console.log(err);
					if(err)
					{
						reject(err);
					}
					else {
						resolve(user);
					}
				});
			}
			else
			{
				reject(err);
			}
		});
	})
}

//AUTH

var getAccessToken = function(bearerToken, callback) {
	console.log('getting token');
	tokenModel.findOne({
		accessToken: bearerToken
	}, callback);
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
		console.log("getting user", user);
		var hash = user.password;
		bcrypt.compare(password, hash).then((res) => {
			callback(err, user);
		});
	});
};

module.exports = {
	getAccessToken: getAccessToken,
	getClient: getClient,
	grantTypeAllowed: grantTypeAllowed,
	saveAccessToken: saveAccessToken,
	getUser: getUser,
	newUser: newUser,
	init: init,
	requestPasswordReset :requestPasswordReset
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
