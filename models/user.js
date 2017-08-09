module.exports = (sequelize, DataTypes) => {
    const Model = sequelize.define("user", {
        status: {
            type: DataTypes.INTEGER, 
            defaultValue: 0
        }
    }, {
        tableName: 'user',
        classMethods: {
            associate: models => {
                Model.belongsTo(models.app);
            }
        }
    });

  return Model;
};