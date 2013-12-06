/**
 * tube-sleuth - searches youtube and returns the first result
 *
 */
"use strict";

var parser     = require('../../lib/messageParser');
var ignore     = require('../../plugins/ignore');
var request    = require('request');
var sleuth     = {};
var hbs        = require('handlebars');
var _          = require('underscore');

sleuth.init = function (client) {
    client.ame.on('actionableMessageAddressingBot', function (info) {        
        var isQuestion = sleuth.isQuestion(info.message);
        var videoCallback = function (video) {
            var msg = 'No results';
            
            if (video) {
                msg = sleuth.getTitleTemplate(video);
            }
            
            client.say(info.channel, msg);
        };
        
        // Basic YT search
        if (isQuestion) {
            var query  = sleuth.parseInputIntoQuery(info.message);
            
            if (query) {
                sleuth.getFirstSearchResult(query, videoCallback);
            }
        } else {
            // some other command
            if (info.command === 'ytrand') {
                var query = info.words.slice(2).join(' ');
                
                if (query) {
                    sleuth.getRandomSearchResult(query, videoCallback);
                }          
            }
        }
    });
};

sleuth.getTitleTemplate = function (video) {
    var input = '\u0002{{{title}}}\u0002 :: {{{link}}}';
    var tpl   = hbs.compile(input);
    
    return tpl({
        title: video.title,
        link : video.link
    });
};

sleuth.isQuestion = function (input) {
    var trimmed = input.trim()
    var lastChr = trimmed.substring(trimmed.length-1);
    
    return lastChr === '?';
};

sleuth.parseInputIntoQuery = function (input) {
    var query   = '';
    
    // Split into words and remove the first one, which would be the bot's nick
    var words = parser.splitMessageIntoWords(input);
    
    // After splitting the words, take everything after the first word
    // and rejoin it with spaces
    query = words.slice(1).join(' ');
    
    // Now remove question mark at the end
    query = query.substring(0, query.length-1);
    
    return query;
};

sleuth.getRandomSearchResult = function (query, callback) {
    sleuth.getYoutubeSearchResults(query, function (video) {
        if (typeof video === 'object') {
            callback({
                title: video.title,
                link : 'https://youtube.com/watch?v=' + video.id
            });
        } else {
            callback(false);
        }
    });
};

sleuth.getFirstSearchResult = function (query, callback) {
    sleuth.getYoutubeSearchResponse(query, function (video) {
        if (typeof video === 'object') {
            callback({
                title: video.title,
                link : 'https://youtube.com/watch?v=' + video.id
            });
        } else {
            callback(false);
        }
    });
};

/**
 * Get 10 results, ultimately returning one at random
 *
 */
sleuth.getYoutubeSearchResults = function (query, callback) {
    var limit  = 10;
    var apiURL = sleuth.getYoutubeSearchAPIURL(query, limit);
    
    request(apiURL, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var rawResponse  = JSON.parse(body);
            var videoInfo    = sleuth.parseResultSet(rawResponse);
            
            callback(videoInfo);
        } else {
            console.log('sleuth error: ', error, 'status code', response.statusCode);
            console.log(body);
        }
    });
};

sleuth.getYoutubeSearchAPIURL = function (query, limit) {
    var apiURL  = 'https://gdata.youtube.com/feeds/api/videos?q=';
        apiURL += encodeURIComponent(query) + '&max-results=' + limit + '&v=2&alt=json';
    
    return apiURL;
};

/**
 * Find a single video
 *
 */
sleuth.getYoutubeSearchResponse = function (query, callback) {
    var apiURL  = sleuth.getYoutubeSearchAPIURL(query, 1);
    
    request(apiURL, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var rawResponse  = JSON.parse(body);
            var videoInfo    = sleuth.parseResponse(rawResponse);
            
            callback(videoInfo);
        } else {
            console.log('sleuth error: ', error, 'status code', response.statusCode);
            console.log(body);
        }
    });
};

// TODO this is almost identical to parseResponse. There has to be a way to refactor
// these two methods to be less redundant
sleuth.parseResultSet = function (results) {
    // there is definitely a better way to do this
    var entries = typeof results.feed === 'object' && results.feed.entry || [];
    
    if (entries && entries.length > 0) {
        var video   = entries[Math.floor(Math.random() * entries.length)];
        var title   = video.title['$t'];
        var link    = video.content.src;
        var id      = _.last(video.id['$t'].split(':'));
        
        return {
            title: title,
            link : link,
            id   : id
        };
    }
};

sleuth.parseResponse = function (response) {
    // there is definitely a better way to do this
    var entries = typeof response.feed === 'object' && response.feed.entry || [];
    
    if (entries && entries.length > 0) {
        var video   = entries[0];
        var title   = video.title['$t'];
        var link    = video.content.src;
        var id      = _.last(video.id['$t'].split(':'));
        
        return {
            title: title,
            link : link,
            id   : id
        };
    }
};

module.exports = sleuth;