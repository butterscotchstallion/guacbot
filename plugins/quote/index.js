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
                
                logger.getRandomQuote(targetNick, function (result, err) {
                    if (!err && result) {
                        var msg  = '<' + targetNick + '> ';
                            msg += result.message;
                        
                        client.say(channel, msg);
                    } else {
                        client.say(channel, 'no quotes found');
                    }
                });
            }
        }
    });
};

module.exports = quote;