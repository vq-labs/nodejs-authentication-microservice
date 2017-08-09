/**
  Reads 'x-auth-viciauth-{token/app-key/api-key}' values from header of the request and assignes them to a property 'auth' of the request 
*/
const readHeaders = (req, res, next) => {
  req.auth = {};
  req.auth.token = req.headers['x-auth-viciauth-token'];
  req.auth.appKey = req.headers['x-auth-viciauth-app-key'];
  req.auth.apiKey = req.headers['x-auth-viciauth-api-key'];

  return next();
};

module.exports = readHeaders;
