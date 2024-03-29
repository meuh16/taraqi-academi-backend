const pool = require('../config/database')
const Sequelize = require('sequelize');
const answer = require('./answer');

var question = pool.define('question', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    examId: {
        type:  Sequelize.DataTypes.UUID,
    },
    place: {
        type: Sequelize.INTEGER,
    },
    description: {
        type: Sequelize.TEXT,
    },
    type: {
        type: Sequelize.STRING
    },
    note: {
        type: Sequelize.STRING
    },
    content: {
        type: Sequelize.TEXT
    }
})


question.hasMany(answer, { as: 'answers', foreignKey: 'questionId' });
answer.belongsTo(question, { as: 'question', foreignKey: 'questionId' });

question.sync().then(function() {
    console.log('DB connection successful.');
}).catch(err=> {console.log('error has occured', err)});

module.exports = question;