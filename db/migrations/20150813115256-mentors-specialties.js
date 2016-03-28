export function up(queryInterface, Sequelize) {
  return queryInterface.createTable('mentors_specialties', {
    specialtyName: {
      type: Sequelize.STRING,
      allowNull: false,
      references: { model: 'specialties', key: 'name' },
      primaryKey: true,
    },
    mentorId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'mentors', key: 'id' },
      primaryKey: true,
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
  });
}

export function down(queryInterface) {
  return queryInterface.dropTable('mentors_specialties');
}
