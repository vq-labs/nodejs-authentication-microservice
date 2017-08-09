const async = require("async");
const AuthService = require("../services/AuthService.js");
const models = require("../models");

const checkToken = (appId, token, callback) => {
	if (!appId || !token) {
		return callback({
      status: 400,
      code: "INITIAL_PARAMS"
    });
	}
  
  async.waterfall([
        callback => AuthService.checkToken(appId, token, (err, rUserToken) => {
          if (err) {
            return callback(err);
          }
          
          if (!rUserToken) {
            return callback({
              status: 400, 
              code: "WRONG_TOKEN"
            });  
          }

          if (rUserToken.deleted) {
            return callback({
              status: 400, 
              code: "INVALID_TOKEN"
            });
          }

          return callback(null, rUserToken);
        }),
  ], (err, rUserToken) => callback(err, rUserToken));
};

const changePassword = (appId, userId, newPassword) => {
  models.userPassword.destroy({
    where: [
      { userId },
      { appId }
    ]
  }).then(() => {
    AuthService.createNewPassword(appId, userId, newPassword, () => {});
  })
};



module.exports = {
  changePassword,
  checkToken
};
