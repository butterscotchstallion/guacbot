/**
 * db - database operations
 *
 */
"use strict";

var mysql = require('mysql');
var db    = {};

db.init = function (config, callback) {
    if (typeof db.connection === 'undefined') {
        db.connect(config, callback);
    }
    
    db.handleDisconnect(db.connection);
}; 

db.connect = function (config, callback) {
    if (typeof db.connection === 'undefined') {
        db.connection = mysql.createConnection(config);
        //db.connection.query('use ' + config.database);
        
        db.connection.connect(function (err) {
            if (!err) {
                if (typeof callback === 'function') {
                    callback(config);
                } else {
                    console.log('db: connected to "' + config.database + '"');
                }
                
            } else {
                console.log('db: ERROR connecting to "' + config.database + '": ', err);
            }
        });
    }
};

db.handleDisconnect = function (connection) {
    connection.on('error', function(err) {
        if (!err.fatal) {
            return;
        }
        
        if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
            console.log(err);
            //throw err;
        }
        
        console.log('db: Re-connecting lost connection: ' + err.stack);
        
        connection = mysql.createConnection(connection.config);
        db.handleDisconnect(connection);
        db.connect();
    });
};

module.exports = db;