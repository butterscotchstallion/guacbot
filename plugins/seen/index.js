/**
 * seen - tracks last message/timestamp/nick/host etc
 * about people in the channel
 *
 */
"use strict";

var moment = require('moment');
var mysql  = require('mysql');
var parser = require('../../lib/messageParser');
var seen   = {};

seen.init = function (client) {
    seen.config = client.config;
    
    seen.connect(seen.config.db);
    
    client.addListener('message#', function (nick, channel, text, message) {
        seen.add({
            nick: nick,
            channel: channel,
            host: message.user + '@' + message.host,
            message: text
        }, function (result, err) {
            if (err) {
                console.log(err);
            } else {
                //console.log(result);
                console.log('adding ' + nick + ' to seen db');
            }
        });
        
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);

        if (isAddressingBot) {
            var words    = parser.splitMessageIntoWords(text);
            var command  = words[1];
            var nick     = words[2];
            
            if (command === 'seen' && nick.length > 0) {
                seen.get(nick, function (result, err) {
                    if (!err && result) {
                        
                        if (typeof(result.nick) !== 'undefined') {
                            // todo: 5 minutes go
                            var lastSeen = moment(result.lastSeen).fromNow();
                            var msg  = result.nick + ' was last seen on ' + lastSeen;
                                msg += ' saying "' + result.message + '"';
                            
                            client.say(channel, msg);
                        } else {
                            client.say(channel, 'nope');
                        }
                        
                    } else {
                        console.log(err);
                        client.say(channel, 'nope');
                    }
                });
            }
        }
    });
};

seen.connect = function (config) {
    seen.connection = mysql.createConnection({
        database : config.name,
        host     : config.host,
        user     : config.username,
        password : config.password,
    });
    
    seen.connection.connect(function (err) {
        if (!err) {
            //console.log('seen: connected to "' + config.name + '"');
        } else {
            console.log('seen: ERROR connecting to "' + config.name + '"');
        }
    });
};

seen.get = function (nick, callback) {
    var q = seen.getSeenQuery(nick);
    
    seen.connection.query(q.query, q.params, function (err, rows, fields) {
        var result = rows.length === 1 ? rows[0] : rows;
        
        callback(result, err);
    });
};

seen.add = function (info, callback) {
    var q = seen.getAddQuery(info);
    
    var query = seen.connection.query(q.query, q.params, function (err, results) {
        //console.log(results);
        console.log(query.sql);
        
        callback(results, err);
    });
};

seen.getAddQuery = function (info) {
    var query  = 'INSERT INTO seen SET ?, last_seen = NOW()';
        query += ' ON DUPLICATE KEY';
        query += ' UPDATE last_seen = NOW(),';
        query += ' channel = ' + seen.connection.escape(info.channel) + ',';
        query += ' message = ' + seen.connection.escape(info.message) + ',';
        query += ' host    = ' + seen.connection.escape(info.host);
        
    return {
        query: query,
        params: info
    };
};

seen.getSeenQuery = function (nick) {
    var query = "SELECT nick,"+
                        "host,"+
                        "message,"+
                        "last_seen AS lastSeen,"+
                        "channel"+
                 " FROM seen"+
                 " WHERE 1=1"+
                 " AND nick = ?";
    
    return {
        query: query,
        params: [nick]
    }
};

module.exports = seen;