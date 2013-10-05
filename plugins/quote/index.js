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
var hbs    = require('handlebars');
var moment = require('moment');
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
                        var msg  = quote.getQuoteTemplate({
                            nick   : targetNick,
                            message: result.message,
                            date   : moment(result.ts).format('MMM DD YYYY hh:mm:ssA')
                        });
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'No quotes found');
                    }
                });
            break;
            
            case 'first':
                if (info.words[2] === 'mention') {
                    var query  = info.words.slice(3).join(' ');
                    var minlen = 3;
                    
                    if (query.length >= minlen) {
                        logger.getFirstMention(query, function (result) {
                            if (result && result.message !== info.message) {
                                var msg  = quote.getQuoteTemplate({
                                    nick   : result.nick,
                                    message: result.message,
                                    date   : moment(result.ts).format('MMM DD YYYY hh:mm:ssA')
                                });
                                
                                client.say(info.channel, msg);
                            } else {
                                client.say(info.channel, 'No quotes found');
                            }
                        });
                    } else {
                        client.say(info.channel, 'Search query must be at least ' + minlen + ' characters');
                    }
                    
                } else if (info.words[2] === 'quote') {
                    var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                    
                    logger.getFirstMessage(targetNick, function (result, err) {
                        if (err) {             
                            console.log(err);
                        }
                        
                        if (result) {
                            var msg  = quote.getQuoteTemplate({
                                nick   : targetNick,
                                message: result.message,
                                date   : moment(result.ts).format('MMM DD YYYY hh:mm:ssA')
                            });
                            
                            client.say(info.channel, msg);
                        } else {
                            client.say(info.channel, 'No quotes found');
                        }
                    });
                }
            break;
            
            case 'last':
                if (info.words[2] === 'mention') {
                    var query  = info.words.slice(3).join(' ');
                    var minlen = 3;
                    
                    if (query.length >= minlen) {
                        logger.getLastMention(query, function (result) {
                            if (result && result.message !== info.message) {
                                var msg  = quote.getQuoteTemplate({
                                    nick   : result.nick,
                                    message: result.message,
                                    date   : moment(result.ts).format('MMM DD YYYY hh:mm:ssA')
                                });
                                
                                client.say(info.channel, msg);
                            } else {
                                client.say(info.channel, 'No quotes found');
                            }
                        });
                    } else {
                        client.say(info.channel, 'Search query must be at least ' + minlen + ' characters');
                    }
                    
                } else if (info.words[2] === 'quote') {                
                    var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                    
                    logger.getLastMessage(targetNick, function (result, err) {
                        if (err) {                            
                            console.log(err);
                        }
                        
                        if (result) {
                            var msg  = quote.getQuoteTemplate({
                                nick   : targetNick,
                                message: result.message,
                                date   : moment(result.ts).format('MMM DD YYYY hh:mm:ssA')
                            });
                            
                            client.say(info.channel, msg);
                        } else {
                            client.say(info.channel, 'No quotes found');
                        }
                    });
                }
            break;
        }
    });
};

quote.getQuoteTemplate = function (info) {
    var quoteTpl = '{{{date}}} <{{{nick}}}> {{{message}}}';
    var tpl      = hbs.compile(quoteTpl);
    
    return tpl(info);
};

quote.getRandomQuote = function (targetNick, searchQry, callback) {
    logger.getRandomQuote(targetNick, searchQry, function (result, err) {
        callback(result, err);
    });
};

module.exports = quote;
