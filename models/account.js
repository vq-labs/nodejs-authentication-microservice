module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("account", {
  }, {
    tableName: 'account',
    classMethods: {
        associate: models => {
            Model.hasMany(models.app);
        }
    }
  });

  return Model;
};