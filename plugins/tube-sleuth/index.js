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
        
        if (isQuestion) {
            var query  = sleuth.parseInputIntoQuery(info.message);
            
            if (query) {
                sleuth.getFirstSearchResult(query, function (video) {
                    var msg = sleuth.getTitleTemplate(video);
                    
                    client.say(info.channel, msg);
                });
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

sleuth.getFirstSearchResult = function (query, callback) {
    sleuth.getYoutubeSearchResponse(query, function (video) {
        callback({
            title: video.title,
            link : 'https://youtube.com/watch?v=' + video.id
        });
    });
};

sleuth.getYoutubeSearchResponse = function (query, callback) {
    var apiURL  = 'https://gdata.youtube.com/feeds/api/videos?q=';
        apiURL += encodeURIComponent(query) + '&max-results=1&v=2&alt=json';
    
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
    var id      = _.last(video.id['$t'].split(':'));
    
    return {
        title: title,
        link : link,
        id   : id
    };
};

module.exports = sleuth;