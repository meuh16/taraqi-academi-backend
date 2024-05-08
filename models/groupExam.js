const pool = require('../config/database')
const Sequelize = require('sequelize')

var groupExam = pool.define('groupExam', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    examId:{
        type: Sequelize.DataTypes.UUID,
    },
    groupId:{
        type: Sequelize.DataTypes.UUID,
    },
    status:{
        type: Sequelize.STRING, 
    },
    note:{
        type: Sequelize.STRING,
    },
    answers:{
        type: Sequelize.TEXT,
    },
})

groupExam.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});;

module.exports = groupExam;