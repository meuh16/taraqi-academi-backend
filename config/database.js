const Sequelize = require('sequelize');

var pool = new Sequelize(process.env.DB, process.env.USER, process.env.PASSWORD, {
    host: process.env.HOST,
    dialect: process.env.DIALECT,
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    timezone: '+01:00',
  });

  pool.sync().then(function() {
    console.log('DB connection successful.');
  }).catch(err=> console.log('error has occured', err));


  const Op = Sequelize.Op;

  module.exports = pool;