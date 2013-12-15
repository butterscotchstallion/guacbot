/**
 * seen - tracks last message/timestamp/nick/host etc
 * about people in the channel. 
 *
 * Plugin dependencies: logger
 *
 */
"use strict";

var moment = require('moment');
var parser = require('../../lib/messageParser');
var logger = require('../../plugins/logger');
var ignore = require('../../plugins/ignore');
var seen   = {};

seen.init = function (client) {
    client.ame.on('actionableMessageAddressingBot', function (info) {        
        var words    = info.words;
        var command  = words[1];
        var nick     = words[2];
        var limit    = words[3];
        
        if (command === 'seen' && nick.length > 0) {
            var seenCB = function (result, err) {
                if (!err && result.length > 0) {
                    var lastSeen, msg;
                    
                    for (var j = 0; j < result.length; j++) {
                        if (typeof(result[j].nick) !== 'undefined') {
                            lastSeen = moment(result[j].ts).fromNow();                            
                            msg      = "\u0002" + result[j].nick + '\u0002 was last seen \u0002' + lastSeen;
                            msg     += '\u0002 saying "\u0002' + result[j].message + '\u0002"';
                            
                            client.say(info.channel, msg);
                        } else {
                            client.say(info.channel, 'nope');
                        }
                    }
                } else {
                    console.log('seen error:', err);
                    client.say(info.channel, 'nope');
                }
            };
            
            var seenInfo = {
                nick    : nick,
                channel : info.channel,
                message : info.message,
                callback: seenCB,
                limit   : limit
            };
            
            logger.getLastMessage(seenInfo);
        }
    });
};

module.exports = seen;