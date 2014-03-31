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
var hmp    = require('../../lib/helpMessageParser');
var ignore = require('../../plugins/ignore/');
var hbs    = require('handlebars');
var moment = require('moment');
var _      = require('underscore');
var quote  = {
    line       : 1,
    quotes     : {}
};

quote.reload = function (options) {
    quote.loadConfig(options);
};

quote.loadConfig = function (options) {
    quote.wholeConfig = options.config;
    quote.botNick     = options.config.nick;
};

quote.init = function (options) {
    var client = options.client;
    
    quote.loadConfig(options);
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        switch (info.command) {
            case 'quote':
                quote.line     = 1;
                // Use this to build a map of number -> log id
                quote.quotes   = {};
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
                            date       : quote.getFormattedDate(result.ts),
                            searchQuery: searchQry,
                            line       : quote.line
                        });
                        
                        client.say(info.channel, msg);
                        
                        quote.quotes[quote.line] = {
                            id     : result.id,
                            channel: info.channel
                        };
                        quote.line++;
                        
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
            
            case 'wordcountme':
            case 'wordcountspy':
                var query      = info.words[1];
                var channel    = info.channel;
                var targetNick = info.nick;
                
                if (query && targetNick) {
                    if (info.words[2].charAt(0) === '#') {
                        channel = info.words[2];
                        query   = info.words.slice(3);
                    }
                    
                    if (info.command === 'wordcountspy') {
                        if (info.words[2].charAt(0) === '#') {
                            targetNick = info.words[3];
                            query      = info.words.slice(4).join(' ');
                        } else {
                            targetNick = info.words[2];
                            query      = info.words.slice(3).join(' ');
                        }
                    }
                    
                    console.log(targetNick, channel, query);
                    
                    var cb = function (row) {
                        row.wordcount = quote.commafy(row.wordcount);
                        
                        var msg = hmp.getMessage({
                            plugin : 'quote',
                            config : quote.wholeConfig,
                            message: 'wordcountMeOK',
                            data   : _.extend({
                                nick: targetNick,
                            }, row)
                        });
                        
                        client.say(info.channel, msg);
                    };
                    
                    var noResultsCB = function () {
                        var msg = hmp.getMessage({
                            plugin : 'quote',
                            config : quote.wholeConfig,
                            message: 'wordcountNoResults'
                        });
                        
                        client.say(info.channel, msg);
                    };
                    
                    logger.getWordCountByNick({
                        callback   : cb,
                        channel    : channel,
                        noResultsCB: noResultsCB,
                        searchQuery: query,
                        nick       : targetNick
                    });
                } else {
                    var message;
                    
                    switch (info.command) {
                        case 'wordcountme':
                            message = 'wordcountmeUsage';
                        break;
                        
                        case 'wordcountspy':
                            message = 'wordcountspyUsage';
                        break;
                    }
                    
                    var msg = hmp.getMessage({
                        plugin  : 'quote',
                        config  : quote.wholeConfig,
                        message : message,
                        data    : {
                            botNick: quote.botNick
                        }
                    });
                    
                    client.say(info.channel, msg);
                }
            break;
            
            case 'wordcount':
                var query   = info.words[1];
                var channel = info.channel;
                
                if (query) {
                    if (info.words[2].charAt(0) === '#') {
                        channel = info.words[2];
                        query   = info.words.slice(3).join(' ');
                    }
                    
                    var cb = function (rows) {
                        var nickLengths = [];
                        
                        // Iterate all rows and find the longest
                        // nick so we can pad the others and they
                        // line up
                        _.each(rows, function (k, j) {
                            nickLengths.push(rows[j].nick.length);
                        });
                        
                        nickLengths.sort(function (a, b) {
                            return a < b;
                        });
                        
                        var longestNickLength = nickLengths[0];
                        
                        var padRight = function (input, pad, len) {
                            var max = (len - input.length)/pad.length;
                            for (var i = 0; i < max; i++) {
                                input += pad;
                            }

                            return input;
                        };
                        
                        // Now send each result with padded nicks
                        _.each(rows, function (k, j) {
                            rows[j].nick      = padRight(rows[j].nick, ' ', longestNickLength);
                            rows[j].wordcount = quote.commafy(rows[j].wordcount);
                            
                            var msg = hmp.getMessage({
                                plugin : 'quote',
                                config : quote.wholeConfig,
                                message: 'wordcountOK',
                                data   : rows[j]
                            });
                            
                            client.say(info.channel, msg);
                        });
                    };
                    
                    var noResultsCB = function () {
                        var msg = hmp.getMessage({
                            plugin : 'quote',
                            config : quote.wholeConfig,
                            message: 'wordcountNoResults',
                            data   : row
                        });
                        
                        client.say(info.channel, msg);
                    };
                    
                    logger.getTopMentions({
                        callback   : cb,
                        channel    : channel,
                        noResultsCB: noResultsCB,
                        searchQuery: query,
                        limit      : 5
                    });
                } else {
                    var msg = hmp.getMessage({
                        plugin  : 'quote',
                        config  : quote.wholeConfig,
                        message : 'wordcountUsage',
                        data    : {
                            botNick: quote.botNick
                        }
                    });
                    
                    client.say(info.channel, msg);
                }
            break;
            
            case 'seen':
                var message    = '';
                var words      = info.words;
                var command    = words[1];
                var nick       = words[2];
                var limit      = words[3];                
                var notSeenMsg = hmp.getMessage({
                    config  : quote.wholeConfig,
                    plugin  : 'quote',
                    message : 'notSeen',
                    data    : {}
                });
                
                if (nick && nick.length > 0) {
                    var seenCB = function (rows, err) {
                        if (rows && rows.length > 0) {
                            quote.line     = 1;
                            // Use this to build a map of number -> log id
                            quote.quotes   = {};
                            
                            _.each(rows, function (k, j) {
                                message = quote.getQuoteTemplate({
                                    nick       : rows[j].nick,
                                    message    : rows[j].message,
                                    date       : quote.getFormattedDate(rows[j].ts),
                                    line       : quote.line
                                });
                                
                                client.say(info.channel, message);
                                
                                quote.quotes[quote.line] = {
                                    id     : rows[j].id,
                                    channel: info.channel
                                };
                                quote.line++;
                            }); 
                        } else {
                            client.say(info.channel, notSeenMsg);
                        }
                    };
                    
                    var seenInfo = {
                        nick    : nick,
                        channel : info.channel,
                        message : info.message,
                        callback: seenCB,
                        limit   : limit
                    };
                    
                    logger.getLastMessage(seenInfo);
                } else {
                    var usage = hmp.getMessage({
                        config  : quote.wholeConfig,
                        plugin  : 'quote',
                        message : 'seenUsage',
                        data    : {
                            botNick: quote.botNick
                        }
                    });
                    
                    client.say(info.channel, usage);
                }
            break;
            
            case 'explain':
                var context = info.words.slice(2);
                var query   = parseInt(context[0], 10) || 1;
                
                if (typeof quote.quotes[query] !== 'undefined') {
                    var q         = quote.quotes[query];
                    var contextID = q.id;
                    
                    var callback  = function (rows) {
                        _.each(rows, function (k, j) {
                            msg = quote.getQuoteTemplate({
                                nick       : rows[j].nick,
                                message    : rows[j].message,
                                date       : quote.getFormattedDate(rows[j].ts),
                                line       : quote.line,
                                contextID  : contextID,
                                id         : rows[j].id
                            });
                            
                            client.say(info.channel, msg);
                            
                            quote.quotes[quote.line] = {
                                id     : rows[j].id,
                                channel: info.channel
                            };
                            
                            quote.line++;
                        });
                    };
                    
                    logger.getContext({
                        id      : contextID,
                        callback: callback,
                        channel : q.channel
                    });
                    
                } else {
                    var msg = hmp.getMessage({
                        plugin : 'quote',
                        config : quote.wholeConfig,
                        data   : info,
                        message: 'error'
                    });
                    
                    client.say(info.channel, msg);
                }
            break;
            
            /**
             * Finds all mentions of a specific phrase with an optional
             * limit on results
             *
             */
            case 'mention':
            case 'mentionall':
            case 'rmention':
                // Search query is everything after the first two words, which are the bot's nick
                // and the 'mention' command
                // n (0) mention (1) query (2)
                var query    = info.words.slice(2);
                var channel  = info.channel;
                quote.line   = 1;
                // Use this to build a map of number -> log id
                quote.quotes = {};
                
                if (info.words[2].charAt(0) === '#') {
                    channel = info.words[2];
                    query   = info.words.slice(3);
                }
                
                var minlen        = 3;
                
                // The limit should be the last integer in the array of words
                var mightBeALimit = _.last(info.words);
                var limit         = 1;
                var messages = hmp.getMessages({
                    plugin  : 'quote',
                    config  : quote.wholeConfig,
                    data    : _.extend({
                        minLen: minlen
                    }, info),
                    messages: ['noResults', 'minSearchQuery']
                });
                
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
                    
                    var cb = function (row) {
                        if (row) {
                            msg = quote.getQuoteTemplate({
                                nick       : row.nick,
                                message    : row.message,
                                date       : quote.getFormattedDate(row.ts),
                                searchQuery: query,
                                line       : quote.line
                            });
                            
                            client.say(info.channel, msg);
                            
                            quote.quotes[quote.line] = {
                                id     : row.id,
                                channel: channel
                            };       
                            quote.line++;
                            
                        } else {
                            client.say(info.channel, messages.noQuotesFound);
                        }
                    };
                    
                    if (info.command === 'mentionall') {
                        channel = null;
                    }
                    
                    var noResultsCB = function () {
                        client.say(info.channel, messages.noQuotesFound);
                    };
                    
                    logger.getMentions({
                        nick       : info.nick,
                        channel    : channel,
                        searchQuery: query,
                        limit      : limit,
                        callback   : cb,
                        message    : info.message,
                        order      : info.command === 'rmention' ? 'RAND()' : 'ts',
                        noResultsCB: noResultsCB
                    });
                    
                } else {
                    client.say(info.channel, messages.minSearchQuery);
                }
            break;
            
            case 'first':
                if (info.words[2] === 'mention') {
                    var query    = info.words.slice(3).join(' ');
                    var minlen   = 3;
                    quote.line   = 1;
                    // Use this to build a map of number -> log id
                    quote.quotes = {};
                
                    var messages = hmp.getMessages({
                        plugin  : 'quote',
                        config  : quote.wholeConfig,
                        data    : _.extend({
                            minLen: minlen
                        }, info),
                        messages: ['noResults', 'minSearchQuery']
                    });
                    
                    if (query.length >= minlen) {
                        var firstMentionCallback = function (result) {
                            
                            if (result && result.message !== info.message) {
                                var msg  = quote.getQuoteTemplate({
                                    nick       : result.nick,
                                    message    : result.message,
                                    date       : quote.getFormattedDate(result.ts),
                                    searchQuery: query,
                                    line       : quote.line
                                });
                                
                                client.say(info.channel, msg);
                                
                                quote.quotes[quote.line] = {
                                    id     : result.id,
                                    channel: info.channel
                                };                            
                                quote.line++;
                            } else {
                                client.say(info.channel, messages.noResults);
                            }
                        };
                        
                        logger.getFirstMention({
                            searchQuery: query,
                            channel    : info.channel,
                            message    : info.message,
                            callback   : firstMentionCallback,
                            line       : quote.line
                        });
                        
                    } else {
                        client.say(info.channel, messages.minSearchQuery);
                    }
                    
                } else if (info.words[2] === 'quote') {
                    var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                    quote.line     = 1;
                    // Use this to build a map of number -> log id
                    quote.quotes   = {};
                    
                    var quoteCB    = function (result, err) {
                        if (err) {             
                            console.log(err);
                        }
                        
                        if (!err && result) {
                            var msg  = quote.getQuoteTemplate({
                                nick   : targetNick,
                                message: result.message,
                                date   : quote.getFormattedDate(result.ts),
                                line   : quote.line
                            });
                            
                            client.say(info.channel, msg);
                            
                            quote.quotes[quote.line] = {
                                id     : result.id,
                                channel: info.channel
                            };
                            quote.line++;
                        } else {
                            client.say(info.channel, messages.noResults);
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
                    var query    = info.words.slice(3).join(' ');
                    var minlen   = 3;
                    quote.line   = 1;
                    // Use this to build a map of number -> log id
                    quote.quotes = {};
                    var messages = hmp.getMessages({
                        plugin  : 'quote',
                        config  : quote.wholeConfig,
                        data    : _.extend({
                            minLen: minlen
                        }, info),
                        messages: ['noResults', 'minSearchQuery']
                    });
                    
                    if (query.length >= minlen) {
                        var lastMentionCallback = function (result, err) {
                            if (!err && result) {
                                var msg  = quote.getQuoteTemplate({
                                    nick       : result.nick,
                                    message    : result.message,
                                    date       : quote.getFormattedDate(result.ts),
                                    searchQuery: query,
                                    line       : quote.line
                                });
                                
                                client.say(info.channel, msg);
                                
                                quote.quotes[quote.line] = {
                                    id     : result.id,
                                    channel: info.channel
                                };                      
                                quote.line++;
                            } else {
                                client.say(info.channel, messages.noResults);
                            }
                        };
                        
                        logger.getLastMention({
                            searchQuery: query,
                            channel    : info.channel,
                            callback   : lastMentionCallback,
                            message    : info.message,
                            line       : quote.line
                        });
                    } else {
                        client.say(info.channel, messages.minSearchQuery);
                    }
                    
                } else if (info.words[2] === 'quote') {                
                    var targetNick = info.words[3] && info.words[3].length > 0 ? info.words[3].trim() : nick;
                    quote.line     = 1;
                    // Use this to build a map of number -> log id
                    quote.quotes   = {};
                    var messages   = hmp.getMessages({
                        plugin  : 'quote',
                        config  : quote.wholeConfig,
                        data    : _.extend({
                            minLen: minlen
                        }, info),
                        messages: ['noResults', 'minSearchQuery']
                    });
                    
                    var lastMessageCallback = function (result, err) {
                        if (err) {                            
                            console.log(err);
                        }
                        
                        if (!err && result) {
                            var msg  = quote.getQuoteTemplate({
                                nick   : targetNick,
                                message: result.message,
                                date   : quote.getFormattedDate(result.ts),
                                line   : quote.line
                            });
                            
                            client.say(info.channel, msg);
                            
                            quote.quotes[quote.line] = {
                                id     : result.id,
                                channel: info.channel
                            };                       
                            quote.line++;
                                
                        } else {
                            client.say(info.channel, messages.noResults);
                        }
                    };
                    
                    logger.getLastMessage({
                        nick    : targetNick,
                        channel : info.channel,
                        message : info.message,
                        callback: lastMessageCallback,
                        line    : quote.line
                    });
                }
            break;
        }
    });
};

quote.commafy = function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

quote.getQuoteTemplate = function (info) {
    var data       = info;
    var lineNumber = '[{{{line}}}] ';
    
    var messages = hmp.getMessages({
        messages: ['quote', 'explain'],
        plugin  : 'quote',
        config  : quote.wholeConfig,
        data    : info
    });
    
    // Bold search query
    if (typeof info.searchQuery !== 'undefined') {
        var boldQry  = "\u0002" + data.searchQuery + "\u0002";
        var re       = new RegExp(data.searchQuery, 'gi');
        var msg      = data.message.replace(re, boldQry);
        data.message = msg;
    }
    
    var quoteTpl     = '{{{date}}} <\u0002{{{nick}}}\u0002> {{{message}}}';
    
    // If we're doing explain, mark the line for which we were looking
    if (typeof info.contextID !== 'undefined') {
        if (info.contextID === info.id) {
            quoteTpl     = "\u000304-> "   + quoteTpl + "\u000304";
        }
    } else {
        // only line numbers for non-explain
        quoteTpl   = lineNumber + quoteTpl
    }
    
    var tpl        = hbs.compile(quoteTpl);
    
    return tpl(data);
};

quote.getFormattedDate = function (timestamp) {
    return moment(timestamp).format("MM/DD/YY hh:mmA");
};

quote.getRandomQuote = function (targetNick, searchQry, callback) {
    logger.getRandomQuote(targetNick, searchQry, function (result, err) {
        callback(result, err);
    });
};

module.exports = quote;
