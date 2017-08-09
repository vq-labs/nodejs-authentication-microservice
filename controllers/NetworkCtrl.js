var bcrypt = require('bcrypt-nodejs');
var async = require("async");
var AuthService = require("../services/AuthService.js");

module.exports = {
	connectToFacebook: connectToFacebook,
};

function connectToFacebook(appId, token, refreshToken, profile, callback) {
	var User, Token, fbId;

	if (!appId) {
		return callback({
			status: 400,
			code: "INITIAL_APP_ID"
		});
	}
	if (!token) {
		return callback({
			status: 400,
			code: "INITIAL_TOKEN"
		});
	}
	if (!profile) {
		return callback({
			status: 400,
			code: "INITIAL_PROFILE"
		});
	}



	fbId = profile.id || profile.fbId;
		
	// id is obsolite, we should use fbId
	if (!fbId)  {
		return callback({
			status: 400,
			code: "INITIAL_PROFILE_ID"
		});
	}


	async.waterfall([
		function(callback) {
			AuthService.getUserIdFromNetwork('facebook', fbId, function(err, rUser) {
				if (err) {
					return callback(err);
				}
				User = rUser;
				return callback();
			});
		},

		function(callback) {
			if (User) {
				AuthService.updateNetworkToken(User.user_id, 'facebook', fbId, token);
				return callback();
			}

			var newUser;
			async.waterfall([
				function(callback) {
					AuthService.createNewUser(appId, function(err, rNewUser) {
						if (err) {
							return callback(err);
						}
						User = rNewUser;
						return callback();
					});
				},
				function(callback) {
					if (profile.emails && profile.emails.length) {

						async.eachSeries(profile.emails, function(Email, callback) {
							AuthService.createNewEmail(appId, User.userId, Email.value, function(err) {
								if (err) {
									return callback(err);
								}
								return callback();
							});
						}, function(err) {
							return callback(err);
						});
					} else {
						return callback();
					}
				},
				function(callback) {
					AuthService.createNewNetwork(appId, User.userId, 'facebook',fbId, token, refreshToken, function(err) {
						if (err) {
							return callback(err);
						}
						return callback();
					});
				},

			], function(err) {
				callback(err);
			});
		},
		function(callback) {
			AuthService.createNewToken(appId, User.userId, function(err, rUser) {
				if (err) {
					return callback(err);
				}
				User = rUser;
				return callback();
			});
		},
		function(callback) {
			if (profile.Props && profile.Props.length) {
				async.eachLimit(profile.Props, 4, function(Prop, callback) {
					AuthService.addUserProp(User.userId, Prop.key, Prop.value, function(err) {
						if (err) {
							return callback(err);
						}
						return callback();
					});
				}, function(err) {
					callback(err);
				});
			} else {
				return callback();
			}
		}
	], function(err) {
		callback(err, User);
	});
}



