module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("userEmail", {
      email: { type: DataTypes.STRING, required: true },
      verified: { type: DataTypes.BOOLEAN, defaultValue: 0 }
  }, {
    tableName: 'userEmail',
    classMethods: {
        associate: models => {
            Model.belongsTo(models.user);
            Model.belongsTo(models.app);
        }
    }
  });

  return Model;
};
