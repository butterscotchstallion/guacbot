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
        switch (info.command) {
            case 'quote':
                var targetNick = info.words[2] && info.words[2].length > 0 ? info.words[2].trim() : info.nick;
                var searchQry  = false;
                
                if (info.words.length >= 3) {
                    searchQry = info.words.slice(3).join(' ');
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
                var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                
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
                var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                
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
