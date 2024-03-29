const pool = require('../config/database')
const Sequelize = require('sequelize')

var answer = pool.define('answer', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    questionId: {
        type:  Sequelize.DataTypes.UUID,
    },
    place: {
        type: Sequelize.INTEGER,
    },
    isCorrect: {
        type: Sequelize.BOOLEAN
    },
    content: {
        type: Sequelize.TEXT
    }
})

answer.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});;

module.exports = answer;