/**
 * Titler - matches URL patterns in the channel and returns the title
 * of that page
 *
 */
"use strict";
var request = require('request');
var titler  = { };

titler.init = function (client) {
    // Listen to messages from any channel
    client.addListener('message#', function (from, to, message) {
        // Only try to get source of things that look like a URL
        if (titler.matchURL(message)) {
            titler.getTitle (message, function (title) {
                if (title) {
                    client.say(to, '^ ' + title);
                }
            });
        }
    });
};

titler.matchURL = function (url) {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
    
    return urlPattern.test(url);
};

titler.getPageHTML = function (url, callback) {
    console.log('Retrieving page HTML for URL: ' + url);
    
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body);
        }
    });
};

titler.parseHTMLAndGetTitle = function (html, callback) {
    var re    = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
    var match = re.exec(html);
    
    if (match && match[2]) {
        // Decode HTML entities in title
        var ent   = require('ent');
        var title = ent.decode(match[2]);
        
        callback(title);
    } else {
        console.log('Failed to find title in html!');
    }
};

titler.getTitle = function (url, callback) {
    // Parse the URL and see if it's a youtube video
    // If so, query the API and get extra info about the video
    var u      = require('url');
    var info   = u.parse(url);
    
    if (info.host && titler.isYoutubeURL(info.host)) {        
        
        // Build title based on API data
        titler.getYoutubeVideoInfo(url, function (data) {
            var title  = data.title;
                title += ' - Rating: ' + data.rating; 
                title += ' - Views: ' + data.viewCount;
                title += ' - Likes: ' + data.likeCount;
                
            callback(title);
        });
        
    } else {    
        titler.getPageHTML(url, function (html) {
            //console.log('parsing title out of HTML');
            titler.parseHTMLAndGetTitle(html, function (title) {
                callback(title);
            });
        });
    }
};

titler.getYoutubeVideoInfo = function (url, callback) {
    var videoID = titler.getYoutubeVideoID(url);
    
    if (videoID) {
        var apiURL = titler.getYoutubeAPIURL(videoID);
        
        request(apiURL, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                callback(JSON.parse(body).data);
            }
        });
        
    } else {
        console.log('Failed to get video ID for url: ' + url);
    }
};

titler.getYoutubeAPIURL = function (videoID) {
    return 'https://gdata.youtube.com/feeds/api/videos/' + videoID + '?v=2&alt=jsonc';
};

titler.getYoutubeVideoID = function (url) {    
    var u       = require('url');
    var qs      = require('qs');
    
    var info    = u.parse(url);
    var query   = info.query;
    var videoID = '';
    
    if (query) {
        var qsInfo = qs.parse(info.query);        
        videoID    = qsInfo.v;
    }
    
    return videoID;
};

titler.isYoutubeURL = function (host) {
    var looksLikeAYoutubeDomain  = host.indexOf('youtube.') > -1;
    var isShortenedYoutubeDomain = host === 'youtu.be';
    
    return looksLikeAYoutubeDomain || isShortenedYoutubeDomain;
};

module.exports = titler;