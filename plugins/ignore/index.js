/**
 * ignore - ignore by hostmask. other plugins use this to check if the nick
 * asking for something is ignored first
 *
 */
"use strict";

var db    = require('../../lib/db');
var admin = require('../../plugins/admin');
var ig    = {};

ig.init   = function (options) {
    var client = options.client;
    ig.argus   = options.argus;
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        var words           = info.words;
        var command         = words[1];
        var nick            = words[2];        
        var userIsAdmin     = admin.userIsAdmin({
            userInfo: info.info
        });
        
        if (nick && (command === 'ignore' || command === 'unignore')) {
            if (userIsAdmin) {
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
            } else {
                console.log("Non-admin attempted to ignore: ", info.info);
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
    // Admins should never be ignored
    var parts    = hostmask.split('@');
    var maskInfo = {
        userInfo: {
            user: parts[0],
            host: parts[1]
        }
    };
    
    if (admin.userIsAdmin(maskInfo)) {
        //console.log(hostmask + ' bypassing ignore due to admin');
        
        callback(false);
        return false;
    }
    
    var cachedNick = ig.argus.getNick();
    
    var q  = ' SELECT COUNT(*) AS ignored';
        q += ' FROM ignored';
        q += ' WHERE host = ?';
    
    db.connection.query(q, [hostmask], function (err, rows, fields) {
        if (err) {
            console.log(err);
        }
        
        if (rows && typeof callback === 'function' ) {
            callback(!!rows[0].ignored, err);
        }
    });
};

module.exports = ig;