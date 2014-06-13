/**
 * tube-sleuth - searches youtube and returns the first result
 *
 */
"use strict";

var parser     = require('../../lib/messageParser');
var ignore     = require('../../plugins/ignore');
var request    = require('request');
var sleuth     = {};
var _          = require('underscore');
var hmp        = require('../../lib/helpMessageParser');
var ent        = require('ent');

sleuth.loadConfig = function (options) {
    sleuth.client      = options.client;
    sleuth.wholeConfig = options.config;
};

sleuth.reload = function (options) {
    sleuth.loadConfig(options);
};

sleuth.init = function (options) {
    var client = options.client;
    
    sleuth.loadConfig(options);
    
    options.ame.on('actionableMessageAddressingBot', function (info) {        
        var videoCallback = function (video) {
            var msg = hmp.getMessage({
                plugin : 'tube-sleuth',
                data   : video,
                config : sleuth.wholeConfig,
                message: 'noResults'
            });
            
            if (video) {
                msg = sleuth.getTitleTemplate(video);
            }
            
            client.say(info.channel, msg);
        };
        
        var messages = hmp.getMessages({
            plugin  : 'tube-sleuth',
            config  : sleuth.wholeConfig,
            messages: ['ytUsage', 'ytrandUsage'],
            data    : {
                botNick: options.config.nick
            }
        });
        
        var query = info.words.slice(2).join(' ');
        
        switch (info.command) {
            case 'yt':
                if (query) {
                    sleuth.getFirstSearchResult(query, videoCallback);
                } else {
                    client.say(info.channel, messages.ytUsage);
                }
            break;
            
            case 'ytrand':
                if (query) {
                    sleuth.getRandomSearchResult(query, videoCallback);
                } else {
                    client.say(info.channel, messages.ytrandUsage);
                }
            break;
        }
    });
};

sleuth.getTitleTemplate = function (video) {
    return hmp.getMessage({
        plugin : 'tube-sleuth',
        data   : video,
        config : sleuth.wholeConfig,
        message: 'ok'
    });
};

sleuth.getYTLink = function (id) {
    return 'https://youtu.be/' + id;
};

sleuth.getRandomSearchResult = function (query, callback) {
    sleuth.getYoutubeSearchResults(query, function (video) {
        if (typeof video === 'object') {
            callback(_.extend(video, {
                title: video.title,
                link : sleuth.getYTLink(video.id)
            }));
        } else {
            callback(false);
        }
    });
};

sleuth.getFirstSearchResult = function (query, callback) {
    sleuth.getYoutubeSearchResponse(query, function (video) {
        if (typeof video === 'object') {
            callback(_.extend(video, {
                title: video.title,
                link : sleuth.getYTLink(video.id)
            }));
            
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
            var videoInfo    = sleuth.parseResponse(rawResponse, true);
            
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
    
    //console.log(apiURL);
    
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

sleuth.commafy = function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

sleuth.parseResponse = function (response, rnd) {
    var entries     = typeof response.feed === 'object' && response.feed.entry || [];
    
    if (entries && entries.length > 0) {
        var idx     = rnd === true ? ~~(Math.random() * entries.length) : 0;
        var video   = entries[idx];
        var title   = video.title['$t'] ? ent.decode(video.title['$t']) : '';
        var link    = video.content.src;
        var id      = _.last(video.id['$t'].split(':'));
        var rating  = typeof video['gd$rating'] !== 'undefined' ? video['gd$rating'].average.toFixed(2) : '';
        var likes   = typeof video['yt$rating'] !== 'undefined' ? video['yt$rating'].numLikes           : false;
        var views   = 0;
        
        // Bug #108 - don't crash when viewcount is unavailable
        if (typeof video['yt$statistics'] === 'object') {
            views = parseInt(video['yt$statistics'].viewCount, 10);
            
            if (views > 0) {
                views = sleuth.commafy(views);
            }
            
        } else {
            views = "unavailable";
        }
        
        return {
            title      : title,
            viewCount  : views,
            rating     : rating,
            likeCount  : likes > 0 ? sleuth.commafy(likes) : 0,
            id         : id,
            link       : link
        };
    }
};

module.exports = sleuth;