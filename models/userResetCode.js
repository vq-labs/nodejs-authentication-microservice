module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define("userResetCode", {
        code: { type: DataTypes.STRING, required: true }
    }, {
      tableName: 'userResetCode',
      classMethods: {
          associate: models => {
              Model.belongsTo(models.user);
              Model.belongsTo(models.app);
          }
      }
    });
  
    return Model;
  };
  