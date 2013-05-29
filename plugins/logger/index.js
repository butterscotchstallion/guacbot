/**
 * logger
 *
 */
"use strict";

var db     = require('../db/');
var logger = {};

logger.init = function (client) {
    // Log channel messages
    client.addListener('message#', function (nick, channel, text, message) {
        var info = {
            nick: nick,
            channel: channel,
            host: message.user + '@' + message.host,
            message: text
        };
        
        logger.log(info, function (result, err) {
            if (err) {
                console.log(err);
            } else {
                //console.log(result);
                //console.log(info);
            }
        });
    });
};

logger.log = function (info, callback) {
    var query = ' INSERT INTO logs SET ?, ts = NOW()';
    
    db.connection.query(query, info, function (err, result) {
        callback(result, err);
    });
};

logger.searchByMessage = function (nick, searchQuery, callback) {
    var cols = ['nick', 'host', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND nick <> ' + db.connection.escape(nick);
        q   += ' AND message LIKE ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT 1';
    
    var parsedQry = db.connection.query(q, ['%' + searchQuery + '%'], function (err, rows, fields) {
        if (err) {
            console.log('logger error: ' + err);
        } else {
            callback(rows[0], err);
        }
    });
    
    //console.log(parsedQry.sql);
};

logger.getLastMessage = function (nick, callback) {
    var cols = ['nick', 'host', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE nick = ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT 1';
    
    db.connection.query(q, [nick], function (err, rows, fields) {
        callback(rows[0], err);
    });
};

module.exports = logger;
