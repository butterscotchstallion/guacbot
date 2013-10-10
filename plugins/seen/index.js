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
        
        if (command === 'seen' && nick.length > 0) {
            var seenCB = function (result, err) {
                if (!err && result) {
                    if (typeof(result.nick) !== 'undefined') {
                        var lastSeen = moment(result.ts).fromNow();
                        var msg      = "\u0002" + result.nick + '\u0002 was last seen \u0002' + lastSeen;
                            msg     += '\u0002 saying "\u0002' + result.message + '\u0002"';
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'nope');
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
                callback: seenCB
            };
            
            logger.getLastMessage(seenInfo);
        }
    });
};

module.exports = seen;