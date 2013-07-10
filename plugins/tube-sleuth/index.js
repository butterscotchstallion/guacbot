/**
 * tube-sleuth - searches youtube and returns the first result
 *
 */
"use strict";

var parser     = require('../../lib/messageParser');
var ignore     = require('../../plugins/ignore');
var request    = require('request');
var sleuth     = {};

sleuth.init = function (client) {
    client.addListener('message#', function (nick, channel, message) {
        var isAddressingBot = parser.isMessageAddressingBot(message, client.config.nick);
        var isQuestion      = sleuth.isQuestion(message);
        
        if (isAddressingBot && isQuestion) {
            ignore.isIgnored(message.user + '@' + message.host, function (ignored) {
                if (!ignored) {
                    var query  = sleuth.parseInputIntoQuery(message);
                    
                    if (query) {
                        sleuth.getFirstSearchResult(query, function (video) {
                            var msg = [video.title, video.link].join(' - ');

                            client.say(channel, msg);
                        });
                    }
                }
            });
        }
    });
};

sleuth.isQuestion = function (input) {
    var lastChr = input.substring(input.length-1);
    
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

sleuth.getFirstSearchResult = function (query, callback) {
    sleuth.getYoutubeSearchResponse(query, function (video) {
        console.log(video);
        
        callback({
            title: video.title,
            link: video.link
        });
    });
};

sleuth.getYoutubeSearchResponse = function (query, callback) {
    var apiURL  = 'https://gdata.youtube.com/feeds/api/videos?q=';
        apiURL += encodeURIComponent(query) + '&max-results=1&v=2&alt=json';
    
    console.log(apiURL);
    
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

sleuth.parseResponse = function (response) {
    var entries = response.feed.entry;
    var video   = entries[0];
    var title   = video.title['$t'];
    var link    = video.content.src;
    
    return {
        title: title,
        link: link
    };
};

module.exports = sleuth;