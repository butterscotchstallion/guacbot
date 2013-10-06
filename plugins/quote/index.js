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
                
                // Maybe search in current channel here
                logger.getRandomQuote(targetNick, searchQry, function (result, err) {
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
                    var msg;
                    
                    var cb            = function (results, err) {
                        if (!err && results.length > 0) {
                            for (var j = 0; j < results.length; j++) {
                                msg = quote.getQuoteTemplate({
                                    nick   : results[j].nick,
                                    message: results[j].message,
                                    date   : moment(results[j].ts).format('MMM DD YYYY hh:mm:ssA')
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
                        callback   : cb
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
                        logger.getFirstMention(query, info.channel, function (result) {
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
                    
                    logger.getFirstMessage(targetNick, info.channel, function (result, err) {
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
                        logger.getLastMention(query, info.channel, function (result) {
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
                    
                    logger.getLastMessage(targetNick, info.channel, function (result, err) {
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
    var quoteTpl = '{{{date}}} <\u0002{{{nick}}}\u0002> {{{message}}}';
    var tpl      = hbs.compile(quoteTpl);
    
    return tpl(info);
};

quote.getRandomQuote = function (targetNick, searchQry, callback) {
    logger.getRandomQuote(targetNick, searchQry, function (result, err) {
        callback(result, err);
    });
};

module.exports = quote;
