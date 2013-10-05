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
var ignore = require('../../plugins/ignore/');
var quote  = {};

quote.init = function (client) {
    client.ame.on('actionableMessageAddressingBot', function (info) {
        var words    = parser.splitMessageIntoWords(info.message);
        var command  = words[1];
        
        switch (command) {
            case 'quote':
                var targetNick = words[2] && words[2].length > 0 ? words[2].trim() : nick;
                var searchQry  = false;
                
                if (words.length >= 3) {
                    searchQry = words.slice(3).join(' ');
                } 
                
                quote.getRandomQuote(targetNick, searchQry, function (result, err) {
                    if (!err && result) {
                        var msg  = '<' + targetNick + '> ';
                            msg += result.message;
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'no quotes found');
                    }
                });
            break;
            
            case 'first':
                var targetNick = words[3] && words[3].length > 0 ? words[3].trim() : nick;
                
                logger.getFirstMessage(targetNick, function (result, err) {
                    if (err) {             
                        console.log(err);
                    }
                    
                    if (result) {
                        var msg  = '<' + targetNick + '> ';
                            msg += result.message;
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'no quotes found');
                    }
                });
            break;
            
            case 'last':
                var targetNick = words[3] && words[3].length > 0 ? words[3].trim() : nick;
                
                logger.getLastMessage(targetNick, function (result, err) {
                    if (err) {                            
                        console.log(err);
                    }
                    
                    if (result) {
                        var msg  = '<' + targetNick + '> ';
                            msg += result.message;
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'no quotes found');
                    }
                });
            break;
        }
    });
};

quote.getRandomQuote = function (targetNick, searchQry, callback) {
    logger.getRandomQuote(targetNick, searchQry, function (result, err) {
        callback(result, err);
    });
};

module.exports = quote;
