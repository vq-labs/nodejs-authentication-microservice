var async = require("async");
var AuthService = require("../services/AuthService.js");

const createLocalAccount = (appId, email, password, callback) => {
  if (!appId || !email || !password) {
    return callback({
      status: 400,
      code: "INITIAL_PARAMS"
    });
  }
  
  var newUser = {};

	if (password) {
		newUser.password = AuthService.generateHashSync(password);
	}
	
  async.waterfall([
    callback => AuthService.createNewUser(appId, (err, rNewUser) => {
        if (err) {
          return callback(err);
        }

        newUser = rNewUser;
        
        return callback();
    }),
    callback => AuthService.createNewEmail(appId, newUser.id, email, callback),
    callback => AuthService.createNewPassword(appId, newUser.id, password, callback),
    callback => AuthService.createNewToken(appId, newUser.id, callback)
  ], (err, rUserToken) => {
    if (err) {
      console.error(err);
    }

    callback(err, rUserToken);
  });
};

module.exports = {
	createLocalAccount: createLocalAccount,
};