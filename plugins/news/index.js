/**
 * news - periodically show headlines from various news sites
 *
 */
"use strict";

var fs         = require('fs');
var xml2js     = require('xml2js');
var request    = require('request');
var parser     = require('../../lib/messageParser');
//var g          = require('goo.gl');
var news       = {
    headlines: [],
    
    feeds: {
        ap: [
            // top headlines
            'http://hosted2.ap.org/atom/APDEFAULT/3d281c11a96b4ad082fe88aa0db04305',
            
            // strange
            'http://hosted2.ap.org/atom/APDEFAULT/aa9398e6757a46fa93ed5dea7bd3729e'
        ],
        
        hp: [
            // latest news
            'http://feeds.huffingtonpost.com/huffingtonpost/LatestNews',
            
            // full feed
            'http://feeds.huffingtonpost.com/huffingtonpost/raw_feed',
            
            // weird
            'http://www.huffingtonpost.com/feeds/verticals/weird-news/index.xml',
            
            // sports
            'http://www.huffingtonpost.com/feeds/verticals/sports/index.xml',
            
            // most popular
            'http://www.huffingtonpost.com/feeds/verticals/most_popular_entries/index.xml'
        ],
        
        npr: ['http://www.npr.org/rss/rss.php?id=1001']
        
        /*
        drudgereport: [
            'http://feeds.feedburner.com/DrudgeReportFeed'
        ]
        */
    },
    
    cache: {
    
    }
};

news.init = function (client) {
    // Refresh feeds on load
    //if (news.cache.length === 0) {
        news.refreshFeeds();
    //}
    
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
    
    for (var site in news.feeds) {
        for (var j = 0; j < news.feeds[site].length; j++) {
            f = news.feeds[site][j];
            
            //console.log('refreshing ' + site + ' feed');
            
            news.getFeed(f, function (xml) {
                if (typeof news.cache[site] === 'undefined') {
                    news.cache[site] = [];
                }
                
                if (news.cache[site].indexOf(xml) === -1) {
                    news.cache[site].push(xml);
                    newFeeds++;
                }
            });
        }
    }
    
    //console.log('Found ' + newFeeds + ' new feed!');
};

news.getFeed = function (url, callback) {
    var options = {
        uri: url,
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36'
        },
    };
    
    console.log('news fetching ' + url);
    
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
    
    for (var site in news.cache) {
        for (var j = 0; j < news.cache[site].length; j++) {
            news.getHeadlines(news.cache[site][j], site, function (headlines) {
                for (var k = 0; k < headlines.length; k++) {
                    allHeadlines.push(headlines[k]);
                }
            });
        }
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

news.getHeadlines = function (xml, site, callback) {
    xml2js.parseString(xml, function (err, result) {
        if (err) {
            console.log(err);
        }
        
        var headlines = [];
        
        //console.log('parsing headlines for ' + site);
        
        switch (site) {
            case 'hp':
                var entries = result.feed.entry;
                var title, link;
                
                for (var j = 0; j < entries.length; j++) {
                    title = entries[j].title[0];
                    link  = entries[j].link[0]['$'].href;
                    
                    //if (typeof title !== 'string' || typeof link !== 'string') {
                        console.dir(entries[j].title[0]);
                        console.dir(entries[j].link[0]['$'].href);
                    //}
                    
                    headlines.push({
                        title: title,
                        link: link
                    });
                }
            break;
            
            //case 'drudgereport':
            case 'ap':
                var entries = result.feed.entry;
                var longLink, title;
                
                for (var j = 0; j < entries.length; j++) {
                    longLink = entries[j].link[0]['$'].href;
                    title    = entries[j].summary[0]['_'];
                    
                    //if (typeof title !== 'string') {
                    //console.log(title);
                    //}
                    
                    headlines.push({
                        title: title,
                        link: longLink
                    });
                }
            break;
            
            case 'npr':
                var items = typeof result.rss !== 'undefined' ? result.rss.channel[0].item : result.feed.entry;
                var link;
                
                for (var j = 0; j < items.length; j++) {
                    link  = items[j].link[0];
                    title = items[j].title[0];
                    
                    headlines.push({
                        title: title,
                        link: link
                    });
                }
            break;
            
            case 'drudgereport':
                var entries = result.feed.entry;
                
                for (var j = 0; j < entries.length; j++) {
                    headlines.push({
                        title: entries[j].title[0],
                        link: entries[j]['feedburner:origLink'][0]
                    });
                }
            break;
            
            default:
                console.log('news: invalid site: ' + site);
            break;
        }
        
        callback(headlines);
    });
};

module.exports = news;
