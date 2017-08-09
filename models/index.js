const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");

const dbConn = process.env.VA_ENV === 'production' ?
  process.env.VQ_VA_DB :
  process.env.VQ_VA_DB_TEST || 'mysql://root:kurwa@localhost:3306/vq-auth';

const sequelize = new Sequelize(dbConn, {
  dialect: 'mysql',
  pool: {
    max: 50,
    min: 0,
    idle: 10000
  }
});

const db = {};

fs.readdirSync(__dirname)
    .filter(file => file.indexOf(".") !== 0 && file !== "index.js")
    .forEach(file => {
        var model = sequelize.import(path.join(__dirname, file));

        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.seq = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
