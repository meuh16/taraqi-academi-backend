const pool = require('../config/database')
const Sequelize = require('sequelize')

var studentStudyProgram = pool.define('studentStudyProgram', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    level: {
        type: Sequelize.TEXT
    },
    status: {
        type: Sequelize.STRING
    },
    experationDate: {
        type: Sequelize.DATE
    }
})

studentStudyProgram.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});;

module.exports = studentStudyProgram;