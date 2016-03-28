import sequelize from '../config/sequelize';
import DataTypes from 'sequelize';

export default sequelize.define('specialties', {
  name: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
});
