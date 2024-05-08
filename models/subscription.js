const pool = require('../config/database')
const Sequelize = require('sequelize');
const group = require('./Group');
const question = require('./question');
const student = require('./student');

var subscription = pool.define('subscription', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    paymentDate: {
        type: Sequelize.DATE,
    },
    validationDate: {
        type: Sequelize.DATE,
    },
    expirationDate: {
        type: Sequelize.DATE,
    },
    type: {
        type: Sequelize.STRING,
    },
    status: {
        type: Sequelize.STRING,
    },
    amount: {
        type: Sequelize.STRING,
    },
    program: {
        type: Sequelize.STRING,
    },

})


student.hasMany(subscription, { as: 'subscription', foreignKey: 'studentId' });
subscription.belongsTo(student, { as: 'student', foreignKey: 'studentId' });

subscription.sync().then(function() {
    console.log('DB connection successful.');
}).catch(err=> {console.log('error has occured', err)});;


module.exports = subscription;