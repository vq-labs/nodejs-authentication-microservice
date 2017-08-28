const models = require('../models');

models.account.create({}, {})
    .then(data => {
        console.log(data.dataValues);

        process.exit();
    });