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
                console.log('logger error: ', err);
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

logger.getRandomQuote = function (nick, searchQuery, callback) {
    var cols      = ['ts', 'message'];
    var searchQry = searchQuery ? searchQuery.trim()  : '';
    var searchCls = searchQry   ? ' AND message LIKE ?' : '';
    var params    = [nick];
    
    if (searchCls) {
        params.push('%' + searchQry + '%');
    }
    
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND nick = ?';
        q   += searchCls;
        // Perhaps improve this in the future by selecting the ids and using JS
        // to select randomly from the set. finally, select a single quote using
        // id. This would significantly increase performance in larger data sets
        q   += ' ORDER BY RAND()';
        q   += ' LIMIT 1';
    
    db.connection.query(q, params, function (err, rows, fields) {
        if (err) {
            console.log('logger.getRandomQuote error: ' + err);
        } else {
            callback(rows[0], err);
        }
    });
};

logger.getMentions = function (args) {
    var cols  = ['nick', 'ts', 'channel'];
    
    /**
     * The limit is user input, so let's make sure it's valid
     * 1. Check that it is an integer
     * 2. Between 1 and 5
     *
     */
    var limit = /^[1-5]$/.test(args.limit) ? args.limit : 1;
    
    var q     = ' SELECT DISTINCT message, ';
        q    += cols.join(',');
        q    += ' FROM logs';
        q    += ' WHERE 1=1';
        q    += ' AND channel    = ?';
        q    += ' AND message LIKE ?';
        // Should this be randomly ordered, or by timestamp asc/desc?
        q    += ' ORDER BY RAND()';
        // Can't bind parameters in a limit clause :[
        q    += ' LIMIT ' + limit;
    
    var params    = [args.channel, 
                     '%' + args.searchQuery + '%'];
    
    console.log('searching for ' + args.searchQuery + ' in channel ' + args.channel + ' limit ' + limit);
    
    // Perhaps implement a timeout here
    var parsedQry = db.connection.query(q, params, function (err, rows, fields) {
        if (err) {
            console.log('logger.getMentions error: ' + err);
        } else {
            args.callback(rows, err);
        }
    });
};

logger.searchByMessage = function (nick, searchQuery, callback) {
    var cols = ['nick', 'host', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND nick <> ?';
        q   += ' AND message LIKE ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT 1';
    
    var params    = [nick, '%' + searchQuery + '%'];
    var parsedQry = db.connection.query(q, params, function (err, rows, fields) {
        if (err) {
            console.log('logger error: ' + err);
        } else {
            callback(rows[0], err);
        }
    });
};

logger.getFirstMessage = function (nick, channel, callback) {
    var cols = ['nick', 'host', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1'
        q   += ' AND nick    = ?';
        q   += ' AND channel = ?';
        q   += ' ORDER BY ts ASC';
        q   += ' LIMIT 1';
    
    db.connection.query(q, [nick, channel], function (err, rows, fields) {
        callback(rows[0], err);
    });
};

logger.getFirstMention = function (searchQuery, channel, callback) {
    var cols = ['nick', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND channel    = ?';
        q   += ' AND message LIKE ?';
        q   += ' ORDER BY ts ASC';
        q   += ' LIMIT 1';
    
    var params = [channel, '%' + searchQuery + '%'];
    
    db.connection.query(q, params, function (err, rows, fields) {
        callback(rows[0], err);
    });
};

logger.getLastMention = function (searchQuery, channel, callback) {
    var cols = ['nick', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND message LIKE ?';
        q   += ' AND channel    = ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT 1';
    
    var params = ['%' + searchQuery + '%', channel];
    
    db.connection.query(q, params, function (err, rows, fields) {
        callback(rows[0], err);
    });
};

logger.getLastMessage = function (nick, channel, callback) {
    var cols = ['nick', 'host', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND nick    = ?';
        q   += ' AND channel = ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT 1';
    
    db.connection.query(q, [nick, channel], function (err, rows, fields) {
        callback(rows[0], err);
    });
};

module.exports = logger;
