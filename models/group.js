const pool = require('../config/database')
const Sequelize = require('sequelize')

var group = pool.define('group', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    teacherId:{
        type: Sequelize.DataTypes.UUID,
    },
    name: {
        type: Sequelize.STRING,
    },
    description: {
        type: Sequelize.TEXT,
    },
})

group.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});;

module.exports = group;