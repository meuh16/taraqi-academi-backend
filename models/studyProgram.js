const pool = require('../config/database')
const Sequelize = require('sequelize');
const group = require('./Group');

var studyProgram = pool.define('studyProgram', {
    // Here are the columns of the table
    id:{
        primaryKey: true,
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4
    },
    name: {
        type: Sequelize.STRING,
    },
    description: {
        type: Sequelize.TEXT,
    },
    age: {
        type: Sequelize.STRING,
    },
    duration: {
        type: Sequelize.STRING,
        defaultValue: ''
    },
    studyDuration: {
        type: Sequelize.STRING,
        defaultValue: true

    },
    vacationDuration: {
        type: Sequelize.STRING,
        defaultValue: false
    },
    levels: {
        type: Sequelize.INTEGER,
        defaultValue: false
    },
    levelsDescription: {
        type: Sequelize.TEXT,
    },
    price: {
        type: Sequelize.STRING,
    },
    status: {
        type: Sequelize.STRING,
    }
})

studyProgram.sync().then(function() {
    console.log('DB connection successful.');
}).catch(err=> {console.log('error has occured', err)});

studyProgram.hasMany(group, { as: 'groups', foreignKey: 'studyProgramId' });
// group.belongsTo(studyProgram, { as: 'program', foreignKey: 'studyProgramId' });

module.exports = studyProgram;