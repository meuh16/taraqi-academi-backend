const pool = require('../config/database')
const Sequelize = require('sequelize');
const studyProgram = require('./StudyProgram');
const studentStudyProgram = require('./studentStudyProgram');
const group = require('./Group');
const StudentGroup = require('./StudentGroup');
const exam = require('./exam');
const StudentExam = require('./StudentExam');
const teacher = require('./teacher');
const admin = require('./admin');

var report = pool.define('report', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    adminId: {
        type: Sequelize.DataTypes.UUID,
    },
    teacherId: {
        type: Sequelize.DataTypes.UUID,
    },
    campaign:{
        type: Sequelize.STRING,
    },
    title: {
        type: Sequelize.STRING,
    },
    text: {
        type: Sequelize.TEXT,
    },
    reply: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
    opened: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    replied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
})

report.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});

report.belongsTo(teacher, {
    foreignKey: 'teacherId', // Specify the foreign key column name in the Notification table
    as: 'teacher' // Define alias for the association
});

teacher.hasMany(report, {
    foreignKey: 'teacherId' // Specify the foreign key column name in the Notification table
});

report.belongsTo(admin, {
    foreignKey: 'adminId', // Specify the foreign key column name in the Notification table
    as: 'admin' // Define alias for the association
});

admin.hasMany(report, {
    foreignKey: 'adminId' // Specify the foreign key column name in the Notification table
});

module.exports = report;