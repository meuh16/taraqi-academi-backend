const pool = require('../config/database')
const Sequelize = require('sequelize')

var StudentGroup = pool.define('StudentGroup', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
})

StudentGroup.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});;

module.exports = StudentGroup;