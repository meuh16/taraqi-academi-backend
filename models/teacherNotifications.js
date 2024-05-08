const pool = require('../config/database')
const Sequelize = require('sequelize')
const Student = require('./student');
const teacher = require('./teacher');

var teacherNotifications = pool.define('teacherNotifications', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    teacherId: {
        type:  Sequelize.DataTypes.UUID,
    },
    type: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    value: {
        type: Sequelize.TEXT,
        defaultValue: ''
    },
    opened: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
})

teacherNotifications.sync().then(function() {
    console.log('DB connection successful.');
}).catch(err=> {console.log('error has occured', err)});

teacher.hasOne(teacherNotifications, {
    foreignKey: 'teacherId', // Specify the foreign key column name in the Notification table
    as: 'notification' // Define alias for the association
});

teacherNotifications.belongsTo(teacher, {
    foreignKey: 'teacherId' // Specify the foreign key column name in the Notification table
});

module.exports = teacherNotifications;