const pool = require('../config/database')
const Sequelize = require('sequelize');
const studyProgram = require('./StudyProgram');
const studentStudyProgram = require('./studentStudyProgram');
const group = require('./Group');
const StudentGroup = require('./StudentGroup');
const exam = require('./exam');
const StudentExam = require('./StudentExam');

var student = pool.define('student', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    firstName: {
        type: Sequelize.STRING,
    },
    familyName: {
        type: Sequelize.STRING,
    },
    email: {
        type: Sequelize.STRING,
    },
    random_email_code: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true

    },
    verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    banned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    password: {
        type: Sequelize.TEXT,
    },
    random_pass_code: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
    birthDate: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    phoneNumber: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    country: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    wilaya: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    image: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    description: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
    gender: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    studyLevel: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    schoolName: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    studyField: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    hizbCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
})

student.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});

student.belongsToMany(studyProgram, { through: studentStudyProgram });
studyProgram.belongsToMany(student, { through: studentStudyProgram });

student.belongsToMany(group, { through: StudentGroup });
group.belongsToMany(student, { through: StudentGroup });

student.belongsToMany(exam, { through: StudentExam });
exam.belongsToMany(student, { through: StudentExam });
// exam.belongsToMany(student, { through: studentExam });



module.exports = student;