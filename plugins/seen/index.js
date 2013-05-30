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
    client.addListener('message#', function (nick, channel, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot) {
            ignore.isIgnored(message.user + '@' + message.host, function (ignored) {
                if (!ignored) {
                    var words    = parser.splitMessageIntoWords(text);
                    var command  = words[1];
                    var nick     = words[2];
                    
                    if (command === 'seen' && nick.length > 0) {
                        logger.getLastMessage(nick, function (result, err) {
                            if (!err && result) {
                                
                                if (typeof(result.nick) !== 'undefined') {
                                    var lastSeen = moment(result.ts).fromNow();
                                    var msg  = result.nick + ' was last seen ' + lastSeen;
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
        }
    });
};

module.exports = seen;