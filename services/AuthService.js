const bcrypt = require('bcrypt-nodejs');
const async = require("async");
const randtoken = require('rand-token');
const models = require("../models");
const logIndex = "[AuthService]";

const generateHashSync = password => bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);

const validPasswordSync = (password, encryptedPassword) => {
	if (!password || !encryptedPassword) {
		console.error(logIndex, "validPasswordSync", "initial arguments");

		return false;
	}

	return bcrypt.compareSync(password, encryptedPassword);
}

const createNewUser = (appId, callback) => {
	return models.user
		.create({ appId: appId })
		.then(instance => callback(null, instance), err => callback(err));
};

const createNewPassword = (appId, userId, password, callback) => {
	models.userPassword
		.create({ 
			appId: appId, 
			userId: userId, 
			password: generateHashSync(password)
		})
		.then(instance => callback(), err => callback(err));
};

const createNewEmail = (appId, userId, email, callback) => async.series([
	callback => models.userEmail
	.findOne({
		where: {
			$and: [ 
				{ appId },
					{ email }
			]
		}
	})
	.then(result => {
		if (result) {
			return callback({
				code: "EMAIL_EXISTS"
			});
		}

		return callback();
	}),
	callback => {
		models.userEmail
		.create({
			appId: appId, 
			userId: userId, 
			email: email
		})
		.then(instance => callback(), err => callback(err));
	}
], err => callback(err));



const getUserIdFromNetwork = (network, networkId, callback) => {
	var sql = "SELECT user.id AS userId FROM user AS user";

	sql += " INNER JOIN userNetwork AS network";
	sql += " ON network.userId = user.id"
	sql += ` WHERE network.networkId = ${networkId} AND network.network = '${network}'`;

	models.seq.query(sql)
	.then(result => {
		if (err) {
			return callback(err);
		}

		if (result.length) {
			return callback(null, result[0])
		}

		return callback(null, false);
	});
};

const updateNetworkToken = (userId, network, networkId, token) =>
	models.userToken
		.update({
			token: token
		}, {
			where: {
				$and: [ 
					 { networkId },
					 { userId },
				]
			}
		})
		.then(() => {}, err => console.error(err));

const createNewNetwork = (appId, userId, network, networkId, token, refreshToken, callback) =>
	models.userNetwork
		.create({
			appId: appId,
			userId: userId,
			network: network,
			networkId: networkId,
			token: token,
			refreshToken: refreshToken
		})
		.then(instance => callback(), err => callback(err));

const createNewToken = (appId, userId, callback) =>
	models.userToken
		.create({
			token: randtoken.generate(250),
			userId: userId,
			appId: appId
		})
		.then(instance => callback(null, instance), err => callback(err));

const checkToken = (appId, token, callback) => {
	models.userToken
		.findOne({
			where: [
				{ token },
				{ appId }
			]
		})
		.then(instance => {
			var response = instance || false;

			return callback(null, response);
		}, err => callback(err))
};

const checkPassword = (appId, userId, password, callback) => {
	models.userPassword
		.findOne({
			where: [
				{ userId },
				{ appId }
			]
		})
		.then(instance => {
			var isCorrect = false;

			if (instance) {
				isCorrect = validPasswordSync(password, instance.password);
			}

			return callback(null, isCorrect);
		}, err => callback(err))
};

const getUserIdFromEmail = (appId, email, callback) => {
	return models.userEmail
		.findOne({
			where: [
				{ appId },
				{ email }
			]
		})
		.then(instance => callback(null, instance || false), err => callback(err))
};

var addUserProp = function(userId, propKey, propValue, callback) {
	if (!userId || !propKey) {
		return callback({
			status: 400,
			code: "INITIAL_PARAMS"
		});
	}

	models.userProp.findOne({
		where: [
			{ userId },
			{ propKey }
		]
	})
	.then((err, result) => {
		if (err) {
			console.error(err);

			return callback(err);
		}

		var promise;

		if (result) {
			promise = models.userProp.update({ 
				propValue 
			}, { 
				where: [
					{ propKey },
					{ userId }
				]
			});
		} else {
			promise = models.userProp.create({ 
				propValue,
				propKey,
				userId
			}, { 
				where: [
					{ propKey },
					{ userId }
				]
			});
		}
		
		promise
		.then(() => callback(), callback);
	});
};

module.exports = {
	createNewUser: createNewUser,
	createNewPassword: createNewPassword,
	createNewEmail: createNewEmail,
	createNewToken: createNewToken,
	createNewNetwork: createNewNetwork,
	addUserProp: addUserProp,
	checkPassword: checkPassword,
	checkToken: checkToken,
	getUserIdFromEmail: getUserIdFromEmail,
	getUserIdFromNetwork: getUserIdFromNetwork,
	updateNetworkToken: updateNetworkToken,
	generateHashSync: generateHashSync,
	validPasswordSync: validPasswordSync,
};