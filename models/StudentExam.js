const pool = require('../config/database')
const Sequelize = require('sequelize')

var StudentExam = pool.define('StudentExam', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
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

StudentExam.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});;

module.exports = StudentExam;