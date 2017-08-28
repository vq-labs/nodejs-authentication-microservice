const async = require("async");
const AuthController = require("./controllers/AuthCtrl.js");
const NetworkController = require("./controllers/NetworkCtrl.js");
const SignupController = require("./controllers/SignupCtrl.js");
const LoginController = require("./controllers/LoginCtrl.js");
const AuthService = require("./services/AuthService.js");
const identifyApp = require("./middleware/IdentifyApp.js");
const identifyAppUser = require("./middleware/IdentifyAppUser.js");
const models = require("./models");

const randomToken = require('random-token');

const sendResponse = (res, err, data) => {
	if (err) {
		if (err.status) {
			return res.status(err.status).send(err);
		}

		if (err.code) {
			return res.status(400).send(err);
		}

		if (typeof err === 'string') {
			return res.status(400).send({
				code: err
			});
		}

		return res.status(500).send(err);
	}

	return res.status(200).send(data);
};

module.exports = app => {
	app.post('/auth/token', (req, res, next) => {
		var appId = req.app ? req.app.id : false;
		var token = req.body.token;

		AuthController.checkToken(appId, token, (err, rUser) => {
			return sendResponse(res, err, rUser);
		});
	});
		
	/**
	 * Marks the token as deleted, used for logout.
	 * @param token: token that needs to be invalidated
	 */
	app.delete('/auth/token', (req, res, next) => {
		return models.update({
			deleted: 1 
		}, {
			where: [
				{ token: req.body.token },
				{ appId: req.auth.appId }
			]
		})
		.then(() => sendResponse(res), err => sendResponse(res, err));
	});

	app.post('/auth/password', identifyApp,
	(req, res, next) => {
		if (!req.app) {
			req.user = false;

			return next();
		}

		const token = req.auth.token || req.body.token;
		const appId = req.app.id;
		
		models.userToken
		.findOne({
			where: {
			$and: [
				{ appId },
				{ token }
			]
		}})
		.then(app => {
			if (app) {
				req.user = {
					id: app.dataValues.userId
				};
			} else {
				req.user = false;
			}

			return next();
		}, err => {
			console.error(err);

			return res.status(502).send(err)
		});
	},
	(req, res, next) => {
		var appId = req.app ? req.app.id : false;
		var userId = req.user.id;
		var currentPassword = req.body.currentPassword;
		var newPassword = req.body.newPassword;
		
		AuthService
		.checkPassword(appId, userId, currentPassword, (err, isCorrect) => {
			if (err) {
				return sendResponse(res, err);
			}

			if (isCorrect) {
				AuthController.changePassword(appId, userId, newPassword);

				return sendResponse(res);
			}

			return sendResponse(res, {
				status: 400,
				code: "WRONG_PASSWORD"
			});
		});
	});

	app.post('/auth/password/request-reset',
		identifyApp,
		(req, res, next) => {
			var appId = req.app ? req.app.id : false;
			var email = req.body.email;
			var userEmail, userId;

			async.waterfall([
				cb => models
					.userEmail
					.findOne({
						where: {
							$and: [
								{ email },
								{ appId }
							]
						}
					})
					.then(rUserEmail => {
						if (!rUserEmail) {
							return setTimeout(() => {
								return cb('EMAIL_NOT_FOUND')
							}, 100);
						}

						userEmail = rUserEmail;
						userId = userEmail.userId;

						return cb();
					}, cb),
				cb => models.userResetCode
					.create({
						appId,
						userId: userEmail.userId,
						code: randomToken(64)
					})
					.then(rCode => {
						cb(null, rCode);
					}, cb)
			], (err, resetCode) => sendResponse(res, err, resetCode));
		});

		app.post('/auth/password/reset',
		identifyApp,
		(req, res, next) => {
			const appId = req.app ? req.app.id : false;
			const code = req.body.code;
			const newPassword = req.body.password;

			async.waterfall([
				cb => models
					.userResetCode
					.findOne({
						where: {
							$and: [
								{ code },
								{ appId }
							]
						}
					})
					.then(rUserResetCode => {
						if (!rUserResetCode) {
							return setTimeout(() =>
								cb('WRONG_RESET_CODE'),
								500
							);
						}

						userId = rUserResetCode.userId;

						return cb();
					}, cb),
				cb => {
					return models.userResetCode
					.destroy({
						where: {
							$and: [
								{ appId },
								{ userId }
							]
						}
					})
					.then(_ => cb(), cb)
				},
				cb => {
					return models.userResetCode
					.destroy({
						where: {
							$and: [
								{ appId },
								{ userId }
							]
						}
					})
					.then(_ => cb(), cb)
				},
				cb => AuthService
					.createNewPassword(appId, userId, newPassword, cb)
			], err => sendResponse(res, err, { status: 200 }));
		});

	app.post('/auth/networks/facebook', (req, res) => {
		var appId = req.app ? req.app.id : false;
		var token = req.body.token;
		var refreshToken = req.body.refreshToken;
		var Profile = req.body.Profile;

		NetworkController
		.connectToFacebook(appId, token, refreshToken, Profile, (err, rUser) => {
			return sendResponse(res, err, rUser);
    	});
	});

	/**
	 * Gets VQ user by
	 * @query email
	 * @query userId
	 */
	app.get('/auth/user', (req, res) => {
		var appId = req.app ? req.app.id : false;

		if (req.query.email) {
			return AuthService
				.getUserIdFromEmail(appId, req.query.email, (err, vqUser) => {
					return sendResponse(res, err, vqUser);	
				});
		}

		if (req.query.userId) {
			return AuthService
				.getEmailsFromUserId(appId, req.query.userId, (err, vqUser) => {
					return sendResponse(res, err, vqUser);	
				});
		}
		
		res.status(400).send('Provide email or userId');
	});

	app.post('/auth/local/signup', (req, res) => {
		const appId = req.app ? req.app.id : false;
		const email = req.body.email;
		const password = req.body.password;

		SignupController
		.createLocalAccount(appId, email, password, (err, rUser) => {
			return sendResponse(res,err,rUser);
		});
	});
	
	/**
	 * 
	 */
	app.post('/auth/local/login/token', (req, res, next) => {
		var appId = req.app ? req.app.id : false;
		var email = req.body.email;

		AuthService.getUserIdFromEmail(appId, email, (err, userEmail) => {
			if (err) {
				return sendResponse(res, err, rUser);
			}

			return AuthService.createNewToken(appId, userEmail.userId, (err, userToken) => {
				return sendResponse(res, err, userToken);
			});
		});
	});
	
	app.post('/auth/local/login', (req, res) => {
		var appId = req.app ? req.app.id : false;
		var email = req.body.email;
		var password = req.body.password;

		LoginController
		.loginWithPassword(appId, email, password, (err, rUser) => {
			return sendResponse(res, err, rUser);
		});
	});

	app.post('/auth/pw-reset', (req, res, next) => {
		sendResponse(res, null, null);
	});
};
