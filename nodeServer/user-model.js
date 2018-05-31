var mongoose = require('mongoose');

let clientModel = require('./mongo/model/client');
let	tokenModel = require('./mongo/model/token');
let	userModel = require('./mongo/model/user');
var bcrypt = require('bcrypt');
const saltRounds = 10;

//API

var newUser = function(username, password, email) {
	return new Promise((resolve, reject) => {
		userModel.find({username:username}, function(err,user) {
			if(user.length > 0 || err)
			{
				reject("user already exists");
			}
			userModel.count({}, (err, c) => {
				bcrypt.hash(password, saltRounds).then((hash) => {
					var user = new userModel({
						id: c,
						username: username,
						password: hash,
						email: email
					});
					user.save((err, user) => {
						if (err) {
							reject("internal error creating user");
						}
						resolve();
					});
				});
			});
		});
	});
};

//AUTH

var getAccessToken = function(bearerToken, callback) {
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
	newUser: newUser
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

dump();
//dropUsers();
//dropTokens();
