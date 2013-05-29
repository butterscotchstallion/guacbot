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
                console.log(info);
            }
        });
    });
};

logger.log = function (info, callback) {
    var query  = ' INSERT INTO logs SET ?, ts = NOW()';
        query += ' ON DUPLICATE KEY';
        query += ' UPDATE ts = NOW(),';
        query += ' channel = ' + db.escape(info.channel) + ',';
        query += ' message = ' + db.escape(info.message) + ',';
        query += ' host    = ' + db.escape(info.host);
    
    db.qry(query, function (err, result) {
        callback(result, err);
    });
};

logger.getLastMessage = function (nick, callback) {
    var cols = ['nick', 'host', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE nick = ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT 1';
    
    db.qry(q, [nick], function (err, rows, fields) {
        var result = rows.length === 1 ? rows[0] : rows;
        
        callback(result, err);
    });
};

module.exports = logger;
