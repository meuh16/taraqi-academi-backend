const pool = require('../config/database')
const Sequelize = require('sequelize');
const group = require('./Group');
const question = require('./question');
const groupExam = require('./groupExam');

var exam = pool.define('exam', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    title: {
        type: Sequelize.STRING,
    },
    type: {
        type: Sequelize.STRING,
    },
    time: {
        type: Sequelize.STRING,
    },
    startExam: {
        type: Sequelize.DATE,
    },
    endExam: {
        type: Sequelize.DATE,
    },
    instructions: {
        type: Sequelize.TEXT,
    },
    description: {
        type: Sequelize.TEXT,
    },
    questions: {
        type: Sequelize.TEXT,
    },
    status: {
        type: Sequelize.STRING
    },
    note: {
        type: Sequelize.STRING
    }
})

exam.belongsToMany(group, { through: groupExam });
group.belongsToMany(exam, { through: groupExam });

// exam.hasMany(question, { as: 'questions', foreignKey: 'examId' });
// question.belongsTo(exam, { as: 'exam', foreignKey: 'examId' });

exam.sync().then(function() {
    console.log('DB connection successful.');
}).catch(err=> {console.log('error has occured', err)});;


module.exports = exam;