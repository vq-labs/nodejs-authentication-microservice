const models = require('../models');

const identifyAppUser = (req, res, next) => {
  if (!req.app) {
      req.user = false;

      return next();
  }

  var token = req.auth.token || req.body.token;
  var appId = req.auth.appId;

  models.userToken.findOne({
    where: {
      $and: [
        { appId },
        { token }
      ]
  }})
  .then(app => {
     if (app) {
          req.user = {
            id: app.dataValues.id
          };
      } else {
          req.user = false;
      }

      return next();
  }, err => {
    console.error(err);

    return res.status(502).send(err)
  });
};

module.exports = identifyAppUser;
