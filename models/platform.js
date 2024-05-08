const pool = require('../config/database')
const Sequelize = require('sequelize');

var platform = pool.define('platform', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    phoneNumber: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    postalKey: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    postalNumber: {
        type: Sequelize.STRING,
        defaultValue: ''
    }
})

platform.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});


module.exports = platform;