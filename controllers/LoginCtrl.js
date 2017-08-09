var async = require("async");
var AuthService = require("../services/AuthService.js");

const loginWithPassword = (appId, email, password, callback) => {
 	if (!appId) {
		return callback({
      code: "UNIDENTIFIED_APP"
    });
	}

	if (!appId || !email || !password) {
		return callback({
      code: "INITIAL_PARAMS"
    });
	}

  var User = {}, Token;

	if (password) {
		User.password = AuthService.generateHashSync(password);
	}
	
  async.waterfall([
    callback => {
        AuthService.getUserIdFromEmail(appId, email, (err, rUser) => {
          if (err) {
            return callback(err);
          }

          if (!rUser) {
            return callback({
              status:400,
              code:"EMAIL_NOT_FOUND"
            });  
          }
          
          User = rUser.dataValues;

          return callback();
        });
    },
    callback => {
      AuthService
      .checkPassword(appId, User.userId, password, (err, checkResult) => {
        if (err) {
          return callback(err);
        }

        if (!checkResult) {
          return callback({
            status: 400,
            code: "WRONG_PASSWORD"
          });
        }
        
        return callback();
      });
    }, callback => {
      AuthService.createNewToken(appId, User.userId, (err, rToken) => {
        if (err) {
          return callback(err);
        }

        Token = rToken;

        return callback();
      });
    }, 
  ], err => callback(err, Token));
}

module.exports = {
	loginWithPassword
};

