const models = require('../models');

models.app.create({
    apiKey: 'test',
    appKey: 'test',
    accountId: 1
}, {})
.then(data => {
    console.log(data.dataValues);
});