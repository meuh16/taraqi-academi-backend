const pool = require('../config/database')
const Sequelize = require('sequelize')
const Student = require('./student')

var notifications = pool.define('notifications', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    studentId: {
        type:  Sequelize.DataTypes.UUID,
    },
    examNotification: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    subscriptionNotification: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    resultNotification: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
})

notifications.sync().then(function() {
    console.log('DB connection successful.');
}).catch(err=> {console.log('error has occured', err)});

Student.hasOne(notifications, {
    foreignKey: 'studentId', // Specify the foreign key column name in the Notification table
    as: 'notification' // Define alias for the association
});

notifications.belongsTo(Student, {
    foreignKey: 'studentId' // Specify the foreign key column name in the Notification table
});

module.exports = notifications;