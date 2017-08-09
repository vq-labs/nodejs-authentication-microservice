const models = require('../models');

/**
  Middleware for identifing app
  if the app is identified, the app property on request will be set with appName {string} and appId {number}
*/
const identifyApp = (req, res, next) => {
  if (!req.auth) {
    return next();
  }

  var appKey = req.auth.appKey;
  var apiKey = req.auth.apiKey;

  var app = {};
	
  models.app.findOne({ 
    where: {
      $and: [
        { appKey },
        { apiKey }
      ]
  }})
  .then(app => {
     if (app) {
          req.app = app.dataValues;
      } else {
          req.app = false;
      }

      return next();
  }, err => {
    console.error(err);

    return res.status(502).send(err)
  });
};

module.exports = identifyApp;
