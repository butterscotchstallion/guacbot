/**
 * db - database operations
 *
 */
"use strict";

var mysql = require('mysql');
var db    = {};

db.init = function (client) {
    var cfg = client.config.plugins.db;

    db.connect(cfg);
    
    db.qry    = db.connection.query;
    db.escape = db.connection.escape;
    
    db.handleDisconnect(db.connection);
};

db.connect = function (config) {
    db.connection = mysql.createConnection(config);
    
    db.connection.connect(function (err) {
        if (!err) {
            console.log('db: connected to "' + config.name + '"');
        } else {
            console.log('db: ERROR connecting to "' + config.name + '": ', err);
        }
    });
};

db.handleDisconnect = function (connection) {
    connection.on('error', function(err) {
        if (!err.fatal) {
            return;
        }
        
        if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
            throw err;
        }
        
        console.log('db: Re-connecting lost connection: ' + err.stack);
        
        connection = mysql.createConnection(connection.config);
        db.handleDisconnect(connection);
        db.connect();
    });
};

module.exports = db;