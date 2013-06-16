/**
 * news - periodically show headlines from various news sites
 *
 */
"use strict";

var fs         = require('fs');
var xml2js     = require('xml2js');
var request    = require('request');
var parser     = require('../../lib/messageParser');
var g          = require('goo.gl');
var news       = {
    headlines: [],
    feeds: [
        // top headlines
        'http://hosted2.ap.org/atom/APDEFAULT/3d281c11a96b4ad082fe88aa0db04305',
        
        // offbeat
        'http://hosted2.ap.org/atom/APDEFAULT/aa9398e6757a46fa93ed5dea7bd3729e'
    ],
    xml: [
        
    ]
};

news.init = function (client) {
    if (news.xml.length === 0) {
        news.refreshFeeds();
    }
    
    /** 
     * Refresh feeds every hour
     *
     */
    var oneHourInMS = 3600000;
    
    setInterval(function () {        
        news.refreshFeeds();        
    }, oneHourInMS);
    
    /**
     * Send headlines every 30 minutes
     *
     */
    var thirtyMinutesInMS = 1800000;
    
    setInterval(function () {
        news.getHeadline(function (headline) {
            if (headline) {
                var cfg      = client.config.plugins.news;
                var channels = cfg.channels;
                
                for (var j = 0; j < channels.length; j++) {
                    client.say(channels[j], headline.title + ' - ' + headline.link);
                }
            }
        });
    }, 60000);
    
    client.addListener('message#', function (nick, channel, message) {
        var words           = parser.splitMessageIntoWords(message);
        var isAddressingBot = parser.isMessageAddressingBot(message, client.config.nick);
        
        if (isAddressingBot) {
            if (words[1] === 'news') {
                news.getHeadline(function (headline) {
                    if (headline) {
                        client.say(channel, headline.title + ' - ' + headline.link);
                    } else {
                        client.say(channel, 'no news :[ (' + news.headlines.length + ' cached)');
                    }
                });
            }
            
            if (words[1] === 'refresh') {
                news.refreshFeeds();
                client.say(channel, 'okay!');
            }
        }
    });
};

news.refreshFeeds = function () {
    var f, newFeeds = 0;
    
    console.log('refreshing ' + news.feeds.length + ' feeds');
    
    for (var j = 0; j < news.feeds.length; j++) {
        f = news.feeds[j];
        
        news.getFeed(f, function (xml) {
            if (news.xml.indexOf(xml) === -1) {
                news.xml.push(xml);
                newFeeds++;
            }
        });
    }
    
    console.log('Found ' + newFeeds + ' new feed!');
};

news.getFeed = function (url, callback) {
    var options = {
        uri: url,
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36'
        },
    };
    
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body);
        } else {
            console.log('news error: ', error);
        }
    });
};

news.getHeadline = function (callback) {    
    var hl, allHeadlines = [];
    
    for (var j = 0; j < news.xml.length; j++) {
        news.getHeadlines(news.xml[j], function (headlines) {
            for (var k = 0; k < headlines.length; k++) {
                allHeadlines.push(headlines[k]);
            }
        });
    }
    
    hl = news.getRandomHeadline(allHeadlines);
    
    // Keep track of links we've already sent
    if (news.headlines.length < allHeadlines.length) {            
        if (news.headlines.indexOf(hl.link) !== -1) {
            news.getHeadline(callback);
        } else {
            callback(hl);
            news.headlines.push(hl.link);
        }
    } else {
        callback(false);
    }
};

news.getRandomHeadline = function (headlines) {
    return headlines[Math.floor(Math.random() * headlines.length)];
};

news.shortenLink = function (link, callback) {
    g.shorten(link, callback);
};

news.getHeadlines = function (xml, callback) {
    xml2js.parseString(xml, function (err, result) {
        if (err) {
            console.log(err);
        }
        
        var headlines = [];
        var entries   = result.feed.entry;
        var link, longLink;
        
        for (var j = 0; j < entries.length; j++) {
            longLink = entries[j].link[0]['$'].href;

            headlines.push({
                title: entries[j].summary[0]['_'],
                link: longLink
            });
            
            /*
            news.shortenLink(longLink, function (s) {
                link = s.id || longLink;
                
                console.log(link);
                
                headlines.push({
                    title: entries[j].summary[0]['_'],
                    link: link
                });
            });
            */
        }
        
        callback(headlines);
    });
};

module.exports = news;
