/**
 * ignore - ignore by hostmask. other plugins use this to check if the nick
 * asking for something is ignored first
 *
 */
"use strict";

var parser      = require('../../lib/messageParser');
var db          = require('../../plugins/db');
var admin       = require('../../plugins/admin');
var ig          = {};
var ignoreCount = 0;

ig.init = function (client) {
    client.ame.on('actionableMessageAddressingBot', function (info) {
        var words           = parser.splitMessageIntoWords(info.message);
        var command         = words[1];
        var nick            = words[2];
        
        if (nick && (command === 'ignore' || command === 'unignore')) {
            client.whois(nick, function (data) {
                var hostmask = typeof(data.host) !== 'undefined' ? data.user + '@' + data.host : false;
                
                if (hostmask) {
                    if (command === 'ignore') {
                        ig.add(hostmask, function () {                            
                            client.say(info.channel, 'k');
                        });
                    }
                    
                    if (command === 'unignore') {
                        ig.remove(hostmask, function () {                            
                            client.say(info.channel, 'k');
                        });
                    }
                    
                } else {
                    console.log('ignore: unable to determine hostmask of nick "', nick, '"');
                }
            });
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
        callback(false);
        return false;
    }
    
    // Admins should never be ignored
    var parts    = hostmask.split('@');
    var maskInfo = {
        userInfo: {
            user: parts[0],
            host: parts[1]
        }
    };
    
    if (admin.userIsAdmin(maskInfo)) {
        callback(false);
        return false;
    }
    
    ignoreCount++;
    
    var q  = ' SELECT COUNT(*) AS ignored';
        q += ' FROM ignored';
        q += ' WHERE host = ?';
    
    console.log('#' + ignoreCount + ' :: checking if ' + hostmask + ' is ignored');
    
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