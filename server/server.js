var express = require('express')
var app = express();
var mongoose = require('mongoose')


var db_port = process.env.MONGOLAB_URI || 'mongodb://localhost/socialstocks';

mongoose.connect(db_port);

require('./config/middleware.js')(app, express);

module.exports = app;
