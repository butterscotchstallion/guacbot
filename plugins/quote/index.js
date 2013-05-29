/**
 * quote - random quote by nick
 *
 * Plugin dependencies: logger
 *
 */
"use strict";

var moment = require('moment');
var logger = require('../../plugins/logger');
var parser = require('../../lib/messageParser');
var quote  = {};

quote.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot) {
            var words    = parser.splitMessageIntoWords(text);
            var command  = words[1];
            
            if (command === 'quote') {
                var targetNick = words[2] && words[2].length > 0 ? words[2].trim() : nick;
                
                logger.getRandomQuote(nick, function (result, err) {
                    if (result) {
                        var msg  = '<' + nick + '> ';
                            msg += result.message;
                        
                        client.say(channel, msg);
                    }
                });
            }
        }
    });
};

module.exports = quote;