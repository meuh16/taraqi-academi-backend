const pool = require('../config/database')
const Sequelize = require('sequelize');

var admin = pool.define('admin', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    firstName: {
        type: Sequelize.STRING,
    },
    familyName: {
        type: Sequelize.STRING,
    },
    email: {
        type: Sequelize.STRING,
    },
    random_email_code: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
    active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true

    },
    verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    password: {
        type: Sequelize.TEXT,
    },
    random_pass_code: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
    birthDate: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    phoneNumber: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    country: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    wilaya: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    image: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    description: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
})

admin.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> {console.log('error has occured', err)});


module.exports = admin;