const pool = require('../config/database')
const Sequelize = require('sequelize');
const group = require('./Group');
const question = require('./question');

var exam = pool.define('exam', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    name: {
        type: Sequelize.STRING,
    },
    description: {
        type: Sequelize.TEXT,
    },
    status: {
        type: Sequelize.STRING
    },
    startAt: {
        type: Sequelize.DATE
    }
})

exam.belongsToMany(group, { through: 'GroupExam' });

exam.hasMany(question, { as: 'questions', foreignKey: 'examId' });
question.belongsTo(exam, { as: 'exam', foreignKey: 'examId' });

exam.sync().then(function() {
    console.log('DB connection successful.');
}).catch(err=> {console.log('error has occured', err)});;


module.exports = exam;