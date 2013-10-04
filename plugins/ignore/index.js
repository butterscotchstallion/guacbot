/**
 * ignore - ignore by hostmask. other plugins use this to check if the nick
 * asking for something is ignored first
 *
 */
"use strict";

var parser    = require('../../lib/messageParser');
var db        = require('../../plugins/db');
var ig        = {};

ig.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot) {
            var words           = parser.splitMessageIntoWords(text);
            var command         = words[1];
            var nick            = words[2];
            
            if (nick && (command === 'ignore' || command === 'unignore')) {
                client.whois(nick, function (data) {
                    var hostmask = typeof(data.host) !== 'undefined' ? data.user + '@' + data.host : false;
                    
                    if (hostmask) {
                        if (command === 'ignore') {
                            ig.add(hostmask, function () {                            
                                client.say(channel, 'k');
                            });
                        }
                        
                        if (command === 'unignore') {
                            ig.remove(hostmask, function () {                            
                                client.say(channel, 'k');
                            });
                        }
                        
                    } else {
                        console.log('ignore: unable to determine hostmask of nick "', nick, '"');
                    }
                });
            }
        }
    });
};

ig.remove = function (hostmask, callback) {
    var q  = ' DELETE FROM ignored';
        q += ' WHERE host = ?';
    
    db.connection.query(q, [hostmask], function (err, result) {
        callback(result, err);
    });
};

ig.add = function (hostmask, callback) {
    var q  = ' INSERT INTO ignored (host, ts)';
        q += ' VALUES (?, NOW())';
        q += ' ON DUPLICATE KEY UPDATE';
        q += ' ts = NOW()';
    
    db.connection.query(q, [hostmask], function (err, result) {
        callback(result, err);
    });
};

ig.isIgnored = function (hostmask, callback) {
    // Temporary really ugly fix until refactor
    if (hostmask === 'undefined@undefined') {
        return false;
    }
    
    var q  = ' SELECT COUNT(*) AS ignored';
        q += ' FROM ignored';
        q += ' WHERE host = ?';
    
    console.log('checking if ' + hostmask + ' is ignored');
    
    db.connection.query(q, [hostmask], function (err, rows, fields) {
        if (err) {
            console.log(err);
        }
        
        if (rows && typeof callback === 'function' ) {
            callback(!!rows[0].ignored, err);
            
            if (!!rows[0].ignored) {
                console.log(hostmask + ' is ignored');
            }
        }
    });
};

module.exports = ig;