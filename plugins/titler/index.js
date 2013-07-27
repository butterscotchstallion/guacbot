/**
 * Titler - matches URL patterns in the channel and returns the title
 * of that page
 *
 */
"use strict";
var request = require('request');
var ignore  = require('../ignore/');
var parser  = require('../../lib/messageParser');
var moment  = require('moment');
var cheerio = require('cheerio');

var titler  = {
    lastTopicChange: null
};

titler.loadConfig = function (cfg) {
    titler.cfg = cfg.plugins.titler;
};

titler.init = function (client) {
    titler.loadConfig(client.config);
    
    // Listen to messages from any channel
    client.addListener('message#', function (nick, channel, text, message) {
        ignore.isIgnored(message.user + '@' + message.host, function (ignored) {
            if (!ignored) {
                var link = titler.getFirstLinkFromString(text);
                
                titler.getTitle (link, function (title) {
                    if (title) {
                        client.say(channel, '^ ' + title);
                    }
                });
            }
        });
    });
    
    // Look for topics that have URLs in them
    client.addListener('topic', function (channel, topic, nick, message) {
        if (!titler.lastTopicChange) {
            titler.lastTopicChange = moment();
        }
        
        // We want to ignore the topic event that occurs when joining a channel
        var timeElapsedSinceLastTopicChange = moment().diff(titler.lastTopicChange, 'seconds');
        var threshold                       = 30;
        var isInitialJoinTopicChange        = timeElapsedSinceLastTopicChange < threshold;
        
        if (!isInitialJoinTopicChange) {
            ignore.isIgnored(message.user + '@' + message.host, function (ignored) {
                if (!ignored) {
                    var link = titler.getFirstLinkFromString(topic);
                    
                    if (link) {
                        titler.getTitle (link, function (title) {
                            if (title) {
                                client.say(channel, '^ ' + title);
                            }
                        });
                    }
                }
            });
        }
    });
};

titler.getFirstLinkFromString = function (input) {
    var link  = '', word = '';
    var words = parser.splitMessageIntoWords(input);

    /**
     * sometimes people have text in the same line as the URL,
     * so split the entire message into words
     * and only get the title of the first URL found
     *
     */
    for (var j = 0; j < words.length; j++) {
        word = words[j];
        
        // Only try to get source of things that look like a URL
        if (titler.matchURL(word)) {
            link = word;
            break;
        }
    }
    
    return link;
};

titler.matchURL = function (url) {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
    
    return urlPattern.test(url);
};

titler.isIgnoredDomain = function (domain) {
    var domains = typeof(titler.cfg.ignoreDomains) !== 'undefined' ? titler.cfg.ignoreDomains : [];

    return domains && domains.indexOf(domain) > -1;
};

titler.getPageHTML = function (url, callback) {
    var u               = require('url');
    var host            = u.parse(url).host;
    var isIgnoredDomain = titler.isIgnoredDomain(host);
    
    if (!isIgnoredDomain) {
        //console.log('Retrieving page HTML for URL: ' + url);
        
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
                console.log('titler error: ', error);
            }
        });
        
    } else {
        return false;
    }
};

titler.parseHTMLAndGetTitle = function (html, callback) {
    var $     = cheerio.load(html);
    var title = $('title').text();
    
    if (title && title.length > 0) {
        title = title.replace(/\t/g, '');
        title = title.replace(/\r\n/g, '');
        title = title.replace(/\n/g, ' ');
    }
    
    callback(title);
};

titler.getTitle = function (url, callback) {
    if (url) {
        // Parse the URL and see if it's a youtube video    
        var u    = require('url');
        var info = u.parse(url);
        
        // If so, query the API and get extra info about the video
        if (info.host && titler.isYoutubeURL(info.host)) {        
            
            // Build title based on API data
            titler.getYoutubeVideoInfo(url, function (data) {
                var title = titler.getYoutubeVideoTitleDetailString(data);
                
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
        
    } else {
        callback('');
    }
};

titler.getYoutubeVideoTitleDetailString = function (data) {
    var viewCount = typeof(data.viewCount) !== 'undefined' ? data.viewCount : 0;
    var rating    = typeof(data.rating)    !== 'undefined' ? data.rating    : 0;
    var likeCount = typeof(data.likeCount) !== 'undefined' ? data.likeCount : 0;
    
    var title     = data.title;
        title    += ' - Rating: ' + rating; 
        title    += ' - Views: '  + viewCount;
        title    += ' - Likes: '  + likeCount;
    
    //console.log(title);
    
    return title;
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
    
    //console.log(info);
    
    if (query) {
        var qsInfo = qs.parse(info.query);        
        videoID    = qsInfo.v;        
    } else {
        if (info.hostname === 'youtu.be') {
            videoID = info.path.substring(1);
        }
    }
    
    return videoID;
};

titler.isYoutubeURL = function (host) {
    var looksLikeAYoutubeDomain  = host.indexOf('youtube.') > -1;
    var isShortenedYoutubeDomain = host === 'youtu.be';
    
    return looksLikeAYoutubeDomain || isShortenedYoutubeDomain;
};

module.exports = titler;