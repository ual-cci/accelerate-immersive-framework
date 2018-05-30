var mongoose = require('mongoose');

let clientModel = require('./mongo/model/client');
let	tokenModel = require('./mongo/model/token');
let	userModel = require('./mongo/model/user');

//API

var newUser = function(username, password, onSuccess, onError) {
	userModel.count({}, function(err, c) {
		var user = new userModel({
			id: c,
			username: username,
			password: password
		});
		user.save(function(err, user) {
			if (err) {
				onError();
				return;
			}
			onSuccess();
			return;
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
		username: username,
		password: password
	}, callback);
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
