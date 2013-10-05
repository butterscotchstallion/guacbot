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
        var words    = parser.splitMessageIntoWords(info.message);
        var command  = words[1];
        var nick     = words[2];
        
        if (command === 'seen' && nick.length > 0) {
            logger.getLastMessage(nick, function (result, err) {
                if (!err && result) {
                    if (typeof(result.nick) !== 'undefined') {
                        var lastSeen = moment(result.ts).fromNow();
                        var msg  = result.nick + ' was last seen ' + lastSeen;
                            msg += ' saying "\u0002' + result.message + '\u0002"';
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'nope');
                    }
                    
                } else {
                    console.log('seen error:', err);
                    client.say(info.channel, 'nope');
                }
            });
        }
    });
};

module.exports = seen;