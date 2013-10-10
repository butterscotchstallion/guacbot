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
var _      = require('underscore');
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
                
                var quoteCallback = function (result, err) {
                    if (!err && result) {
                        var msg  = quote.getQuoteTemplate({
                            nick       : targetNick,
                            message    : result.message,
                            date       : quote.getFormattedDate(result[j].ts),
                            searchQuery: searchQry,
                        });
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'No quotes found');
                    }
                };
                
                logger.getRandomQuote({
                    nick       : targetNick,
                    channel    : info.channel,
                    searchQuery: searchQry,
                    callback   : quoteCallback,
                    message    : info.message
                });
                
            break;
            
            /**
             * Finds all mentions of a specific phrase with an optional
             * limit on results
             *
             */
            case 'mention':
                // Search query is everything after the first two words, which are the bot's nick
                // and the 'mention' command
                var query         = info.words.slice(2);
                var minlen        = 3;
                
                // The limit should be the last integer in the array of words
                var mightBeALimit = _.last(info.words);
                var limit         = 1;
                
                // If the last word looks like an integer, then the query should be everything
                // from the third word in the message, up to right before the limit. Meaning,
                // we shouldn't include the limit in the search query.
                if (parseInt(mightBeALimit, 10) > 1) {
                    query = query.slice(0, query.length - 1);
                    limit = mightBeALimit;
                }
                
                // Finally, join the word array by spaces 
                query = query.join(' ');
                
                if (query.length >= minlen) {
                    var msg, fmtDate;
                    
                    var cb = function (results, err) {
                        if (!err && results.length > 0) {
                            for (var j = 0; j < results.length; j++) {
                                msg     = quote.getQuoteTemplate({
                                    nick       : results[j].nick,
                                    message    : results[j].message,
                                    date       : quote.getFormattedDate(results[j].ts),
                                    searchQuery: query,
                                });
                                
                                client.say(info.channel, msg);
                            }
                        } else {
                            client.say(info.channel, 'No quotes found');
                        }
                    };
                    
                    logger.getMentions({
                        nick       : info.nick,
                        channel    : info.channel,
                        searchQuery: query,
                        limit      : limit,
                        callback   : cb,
                        message    : info.message
                    });
                    
                } else {
                    client.say(info.channel, 'Search query must be at least ' + minlen + ' characters');
                }
            break;
            
            case 'first':
                if (info.words[2] === 'mention') {
                    var query  = info.words.slice(3).join(' ');
                    var minlen = 3;
                    
                    if (query.length >= minlen) {
                        var firstMentionCallback = function (result) {
                            if (result && result.message !== info.message) {
                                var msg  = quote.getQuoteTemplate({
                                    nick       : result.nick,
                                    message    : result.message,
                                    date       : quote.getFormattedDate(result.ts),
                                    searchQuery: query,
                                });
                                
                                client.say(info.channel, msg);
                            } else {
                                client.say(info.channel, 'No quotes found');
                            }
                        };
                        
                        logger.getFirstMention({
                            searchQuery: query,
                            channel    : info.channel,
                            message    : info.message,
                            callback   : firstMentionCallback
                        });
                        
                    } else {
                        client.say(info.channel, 'Search query must be at least ' + minlen + ' characters');
                    }
                    
                } else if (info.words[2] === 'quote') {
                    var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                    var quoteCB    = function (result, err) {
                        if (err) {             
                            console.log(err);
                        }
                        
                        if (result) {
                            var msg  = quote.getQuoteTemplate({
                                nick   : targetNick,
                                message: result.message,
                                date   : quote.getFormattedDate(result.ts)
                            });
                            
                            client.say(info.channel, msg);
                        } else {
                            client.say(info.channel, 'No quotes found');
                        }
                    };
                    
                    logger.getRandomQuote({
                        nick    : targetNick,
                        channel : info.channel,
                        callback: quoteCB,
                        message : info.message
                    });
                }
            break;
            
            case 'last':
                if (info.words[2] === 'mention') {
                    var query  = info.words.slice(3).join(' ');
                    var minlen = 3;
                    
                    if (query.length >= minlen) {
                        var lastMentionCallback = function (result) {
                            if (result && result.message !== info.message) {
                                var msg  = quote.getQuoteTemplate({
                                    nick       : result.nick,
                                    message    : result.message,
                                    date       : quote.getFormattedDate(result.ts),
                                    searchQuery: query,
                                });
                                
                                client.say(info.channel, msg);
                            } else {
                                client.say(info.channel, 'No quotes found');
                            }
                        };
                        
                        logger.getLastMention({
                            searchQuery: query,
                            channel    : info.channel,
                            callback   : lastMentionCallback,
                            message    : info.message
                        });
                    } else {
                        client.say(info.channel, 'Search query must be at least ' + minlen + ' characters');
                    }
                    
                } else if (info.words[2] === 'quote') {                
                    var targetNick          = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                    var lastMessageCallback = function (result, err) {
                        if (err) {                            
                            console.log(err);
                        }
                        
                        if (result) {
                            var msg  = quote.getQuoteTemplate({
                                nick   : targetNick,
                                message: result.message,
                                date   : quote.getFormattedDate(result.ts)
                            });
                            
                            client.say(info.channel, msg);
                        } else {
                            client.say(info.channel, 'No quotes found');
                        }
                    };
                    
                    logger.getLastMessage({
                        nick    : targetNick,
                        channel : info.channel,
                        message : info.message,
                        callback: lastMessageCallback
                    });
                }
            break;
        }
    });
};

quote.getQuoteTemplate = function (info) {
    var data     = info;
    // Bold search query
    var boldQry  = "\u0002" + data.searchQuery + "\u0002";
    var msg      = data.message.replace(data.searchQuery, boldQry);
    data.message = msg;
    
    var quoteTpl = '{{{date}}} <\u0002{{{nick}}}\u0002> {{{message}}}';
    var tpl      = hbs.compile(quoteTpl);
    
    return tpl(data);
};

quote.getFormattedDate = function (timestamp) {
    return moment(timestamp).format('MMM DD YYYY hh:mm:ssA')
};

quote.getRandomQuote = function (targetNick, searchQry, callback) {
    logger.getRandomQuote(targetNick, searchQry, function (result, err) {
        callback(result, err);
    });
};

module.exports = quote;
