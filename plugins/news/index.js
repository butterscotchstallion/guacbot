/**
 * news - periodically show headlines from various news sites
 *
 */
"use strict";

var fs         = require('fs');
var xml2js     = require('xml2js');
var request    = require('request');
var parser     = require('../../lib/messageParser');
var db         = require('../db/');

var news       = {
    // Don't log to db when testing
    testMode: true,
    
    headlines: [],
    
    cache: { }
};

news.init = function (client) {
    var pluginCfg  = client.config.plugins.news;
    
    news.pluginCfg = pluginCfg;
    
    // Refresh feeds on load
    //news.refreshFeeds();
    
    /** 
     * Refresh feeds every hour
     *
     */
    var oneHourInMS = 3600000;
    
    setInterval(function () {        
        news.refreshFeeds();        
    }, oneHourInMS);
    
    /**
     * Send headlines periodically according to config
     *
     */
    var thirtyMinutesInMS = 1800000;
    var fiveMinutesInMS   = 300000;
    var fiveSecondsInMS   = 5000;
    var oneMinuteInMS     = 60000;
    var oneHourInMS       = 3600000;
    
    setInterval(function () {
        news.getHeadline(function (headline) {
            if (headline) {
                var cfg      = client.config.plugins.news;
                var channels = cfg.channels;
                
                for (var j = 0; j < channels.length; j++) {
                    var titleType = typeof headline.title;
                    var linkType  = typeof headline.link;
                    
                    /*
                    console.dir(headline);
                    console.dir(titleType);
                    console.dir(linkType);
                    */
                    
                    // TODO figure out why this even happens so I don't need
                    // this ugly thing here
                    if (titleType === 'string' && linkType === 'string') {
                        client.say(info.channels[j], headline.title + ' - ' + headline.link);
                    } else {
                        console.log('');
                        console.dir('objects!', headline);  
                        console.log('');                    
                    }
                }
            }
        });
        
    }, pluginCfg.intervalInMilliseconds);
    
    client.ame.on('actionableMessageAddressingBot', function (info) {
        var words           = parser.splitMessageIntoWords(info.message);
        
        if (words[1] === 'news') {
            news.getHeadline(function (headline) {
                if (headline) {
                    var titleType = typeof headline.title;
                    var linkType = typeof headline.link;
                    
                    if (titleType === 'string' && linkType === 'string') {
                        client.say(info.channel, headline.title + ' - ' + headline.link);
                    } else {
                        console.dir('objects!', headline);                           
                    }
                    
                } else {
                    client.say(info.channel, 'no news :[ (' + news.headlines.length + ' cached)');
                }
            });
        }
        
        if (words[1] === 'refresh') {
            news.refreshFeeds();
            client.say(info.channel, 'okay!');
        }
    });
};

news.refreshFeeds = function () {
    var f, newFeeds = 0;
    
    console.log(new Date(), ' Fetching feeds!');
    
    for (var site in news.pluginCfg.feeds) {
        for (var j = 0; j < news.pluginCfg.feeds[site].length; j++) {
            f = news.pluginCfg.feeds[site][j];
            
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
    
    //console.dir(allHeadlines);
    
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

news.logParsedFeedResult = function (info) {
    if (news.testMode === false) {
        var query = 'INSERT INTO news_feed_output SET ?, ts = NOW()';
        
        db.connection.query(query, info, function (err, result) {
            if (err) {
                console.log('news error logging output: ', err);
            }
        });
    }
};

news.getHeadlines = function (xml, site, callback) {
    var parser = new xml2js.Parser({
        normalize: true
    });
    
    parser.parseString(xml, function (err, result) {
        if (err) {
            console.log('Error parsing XML: ', err);
        }
        
        var headlines = [];
        
        switch (site) {
            case 'hp':
                var entries = typeof(result.feed) !== 'undefined' ? result.feed.entry : [];
                
                var title, link;
                
                for (var j = 0; j < entries.length; j++) {
                    title = entries[j].title[0];
                    link  = entries[j].link[0]['$'].href;
                    
                    if (typeof link !== 'string') {
                        link = entries[j].link[0]['$'].href['$'].href;
                    }
                    
                    headlines.push({
                        title: title,
                        link: link,
                        site: site
                    });
                }
            break;
            
            case 'ap':
                var entries = result.feed.entry;
                var longLink, title;
                
                for (var k = 0; k < entries.length; k++) {
                    longLink = entries[k].link[0]['$'].href;
                    title    = entries[k].summary[0]['_'];
                    
                    if (typeof title === 'string' && typeof longLink === 'stirng') {
                        headlines.push({
                            title: title,
                            link: longLink,
                            site: site
                        });
                    }
                }
            break;
            
            case 'npr':
                var items = typeof result.rss !== 'undefined' ? result.rss.channel[0].item : result.feed.entry;
                var link;
                
                for (var e = 0; e < items.length; e++) {
                    link  = items[e].link[0];
                    title = items[e].title[0];
                    
                    headlines.push({
                        title: title,
                        link: link,
                        site: site
                    });
                }
            break;
            
            case 'onion':
            case 'freedomsphoenix':                
            case 'bbc':
            case 'hackernews':
            case 'fulldisclosure':
            case 'aljazeera':
            case 'fark':
            case 'yahoo':
            case 'tumblr':
            case 'guardian':
                var items = [];
                
                if (typeof result.rss !== 'undefined') {
                    items = result.rss.channel[0].item;
                } else {
                    items = result.feed.entry;
                }
                
                if (items) {
                    for (var y = 0; y < items.length; y++) {
                        headlines.push({
                            title: items[y].title[0],
                            link: items[y].link[0],
                            site: site
                        });
                    }
                }
            break;
            
            default:
                console.log('news: invalid site: ' + site);
            break;
        }
        
        news.logParsedFeedResult({
            raw: xml,
            output: JSON.stringify(result),
            site: site,
            parsed: JSON.stringify(headlines)
        });
        
        callback(headlines);
    });
};

module.exports = news;
