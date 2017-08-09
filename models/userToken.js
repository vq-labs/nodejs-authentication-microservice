module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("userToken", {
        token: { type: DataTypes.STRING },
        deleted: { type: DataTypes.BOOLEAN, defaultValue: 0 }
  }, {
    tableName: 'userToken',
    classMethods: {
        associate: models => {
            Model.belongsTo(models.user);
            Model.belongsTo(models.app);
        }
    }
  });

  return Model;
};