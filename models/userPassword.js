module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("userPassword", {
      password: { type: DataTypes.STRING, required: true }
  }, {
    tableName: 'userPassword',
    classMethods: {
        associate: models => {
            Model.belongsTo(models.user);
            Model.belongsTo(models.app);
        }
    }
  });

  return Model;
};
