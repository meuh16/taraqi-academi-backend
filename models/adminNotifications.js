const pool = require('../config/database')
const Sequelize = require('sequelize')
const admin = require('./admin');

var adminNotifications = pool.define('adminNotifications', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    adminId: {
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
    reportNotification: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    newTeacherNotification: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
})

adminNotifications.sync().then(function() {
    console.log('DB connection successful.');
}).catch(err=> {console.log('error has occured', err)});

admin.hasOne(adminNotifications, {
    foreignKey: 'adminId', // Specify the foreign key column name in the Notification table
    as: 'notification' // Define alias for the association
});

adminNotifications.belongsTo(admin, {
    foreignKey: 'adminId' // Specify the foreign key column name in the Notification table
});

module.exports = adminNotifications;