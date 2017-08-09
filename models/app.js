module.exports = (sequelize, DataTypes) => {
  const Model = sequelize.define("app", {
      appName: { type: DataTypes.STRING },
      appKey: { type: DataTypes.STRING },
      apiKey: { type: DataTypes.STRING }
  }, {
    tableName: 'app',
    classMethods: {
        associate: models => {
            Model.belongsTo(models.account);
            Model.hasMany(models.user);
            Model.hasMany(models.userEmail);
            Model.hasMany(models.userToken);
            Model.hasMany(models.userNetwork);
            Model.hasMany(models.userPassword);
        }
    }
  });

  return Model;
};