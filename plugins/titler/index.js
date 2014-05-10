/**
 * Titler - matches URL patterns in the channel and returns the title
 * of that page
 *
 */
"use strict";
var request    = require('request');
var ignore     = require('../ignore/');
var parser     = require('../../lib/messageParser');
var db         = require('../../lib/db');
var moment     = require('moment');
var cheerio    = require('cheerio');
var easyimg    = require('easyimage');
var path       = require('path');
var fs         = require('fs');
var filesize   = require('filesize');
var ent        = require('ent');
var twitter    = require('../../plugins/twitter');
//var sa         = require('../../plugins/somethingawful');
var pm         = require('../../lib/pluginManager');
var when       = require('when');
var hmp        = require('../../lib/helpMessageParser');
var _          = require('underscore');
//var historian  = require('../../plugins/historian');

var titler  = {
    imageInfoEnabled: false,
    lastTopicChange: null
};

titler.reload = function () {
    titler.loadConfig(titler.wholeConfig);
};

titler.loadConfig = function (cfg) {
    titler.cfg         = cfg.plugins.titler;
    titler.wholeConfig = cfg;
    
    titler.getUserAgents()
          .then(function (agents) {
            var a = [];
            
            if (agents) {
                a = _.pluck(agents, 'agent');
            }
            
            titler.pluginConfig.userAgents = a;
          })
          .catch(function (e) {
            console.log(e.stack);
          });
   
    titler.getIgnoredDomains()
          .then(function (domains) {
            var d = [];
            
            if (domains) {
                d = _.pluck(domains, 'domain');
            }
            
            titler.pluginConfig.ignoredDomains = d;
          })
          .catch(function (e) {
            console.log(e.stack);
          });
};

titler.init = function (options) {
    var client          = options.client;    
    titler.client       = client;
    titler.wholeConfig  = options.config;
    titler.pluginConfig = options.config.plugins.titler;
    titler.loadConfig(options.config);
    
    options.ame.on('actionableMessage', function (info) {
        var link = titler.getFirstLinkFromString(info.message);
        
        if (link && link.length > 0) {
            titler.getTitle (link, function (title) {
                if (title) {
                    client.say(info.channel, title);
                }
            });
        }
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
                                client.say(channel, title);
                            }
                        });
                    }
                }
            });
        }
    });
};

titler.getYoutubeTitleFromTemplate = function (data) {
    var details = titler.getYoutubeVideoTitleDetails(data);
    
    return hmp.getMessage({
        plugin : 'titler',
        config : titler.wholeConfig,
        data   : details,
        message: 'youtube'
    });
};

titler.getTitleFromTemplate = function (title) {
    var message = hmp.getMessage({
        plugin : 'titler',
        config : titler.wholeConfig,
        data   : { title: title },
        message: 'ok'
    });
    
    return message;
};

titler.getFirstLinkFromString = function (input) {
    var link  = '';
    var word  = '';
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
    var urlPattern = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/;
    
    return urlPattern.test(url);
};

titler.isIgnoredDomain = function (domain) {
    return titler.pluginConfig.ignoredDomains.length > 0 && 
           titler.pluginConfig.ignoredDomains.indexOf(domain) !== -1;
};

titler.getUserAgent = function () {
    var defaultAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.94 Safari/537.36';
    var agents       = typeof titler.pluginConfig.userAgents !== 'undefined' ? titler.pluginConfig.userAgents : [];
    var agent        = defaultAgent;
    
    if (agents.length > 0) {
        agent = agents[~~(Math.random() * agents.length)];
    }
    
    return agent;
};

titler.getReferrer = function (urlInfo) {
    return urlInfo.protocol + '//' + urlInfo.host;
};

titler.requestWebsite = function (options) {
    var u               = require('url');
    var urlInfo         = u.parse(options.url);
    var isIgnoredDomain = titler.isIgnoredDomain(urlInfo.host);
    
    if (!isIgnoredDomain) {
        //console.log('Retrieving page HTML for URL: ' + url);
        
        var httpOptions = {
            uri    : options.url,
            headers: {
                'User-Agent': titler.getUserAgent(),
                'Referer'   : titler.getReferrer(urlInfo)
            }
        };
        
        /**
         * Issue #72 - More descriptive SA titles
         *
         */
        //var isSAURL     = sa.isSAURL(urlInfo);
        var isSAURL     = false;
        var isSAEnabled = false;
        
        // Don't even bother checking anything else unless this is a SA URL
        if (isSAEnabled && isSAURL) {
            var isSAPluginLoaded  = pm.getLoadedPlugins().indexOf('somethingawful') !== -1;
            
            if (isSAPluginLoaded) {
                var saCfg       = pm.getPluginConfig('somethingawful');
                var hasUser     = typeof saCfg.sa_user     === 'string' && saCfg.sa_user.length     > 0;
                var hasPassword = typeof saCfg.sa_password === 'string' && saCfg.sa_password.length > 0;
                
                // If SA plugin is loaded and we have valid login details, add cookie
                if (saCfg && hasUser && hasPassword) {
                    console.log('SA loaded with plugin details');
                    
                    options['Cookie'] = sa.getLoginCookie({
                        'bbuserid'  : saCfg.sa_user,
                        'bbpassword': saCfg.sa_password
                    });
                    
                    //console.log(options);
                    
                } else {
                    console.log('sa cfg sux');
                }
            } else {
                console.log('sa plugin not loaded');
            }
        } else {
            titler.sendHTTPRequest({
                httpOptions: httpOptions,
                website    : options.websiteCallback,
                image      : options.imageCallback,
                error      : options.errorCallback
            });
        }
    }
};

titler.sendHTTPRequest = function (options, retries) {    
    request(options.httpOptions, function (error, response, body) {
        var maxRetries    = 2;
        var retryEnabled  = false;
        var retries       = retries || 0;
        
        if (!error) {
            var type      = response.headers['content-type'];
            var isWebsite = titler.isHTML(type);
            
            if (isWebsite) {
                var isOK = response.statusCode >= 200 && response.statusCode <= 400;
                
                console.log('retries: ', retries);
                
                if (isOK) {
                    options.website(body);                    
                } else {
                    console.log('titler error: ',
                        error,
                        ' response code:',
                        response.statusCode,
                        " URL: ", options.url);
                    
                    if (retryEnabled) {
                        if (retries < maxRetries) {
                            console.log('retrying');
                            
                            setTimeout(function () {
                                console.log('sending request');
                                
                                titler.sendHTTPRequest(options, retries);
                                retries++;
                                
                            }, 1000);
                            
                        } else {
                            console.log('max retries exceeded');
                            
                            options.error(response.statusCode);
                        }
                    }
                }
                
            } else {
                if (titler.imageInfoEnabled) {
                    var isImage = titler.isImage(type);
                    
                    if (isImage) {
                        titler.downloadFile(options.uri, function (filename, length) {
                            console.log('file downloaded:', filename);
                            
                            titler.getImageInfo(filename, function (err, img, stderr) {
                                if (err || stderr) {
                                    console.log('Error getting image info: ', err, stderr);
                                } else {
                                    options.image(err, img, stderr, length, filename);
                                }
                            });
                        });
                    }
                }
            }
        }
    });
};

titler.downloadFile = function (uri, callback) {
    request.head(uri, function (err, res, body) {
        var filename  = './images/';
            filename += titler.generateFilename(uri);
        
        var req = request(uri).pipe(fs.createWriteStream(filename));
        
        req.on('finish', function () {
            callback(filename, res.headers['content-length']);
        });
    });
};

titler.generateFilename = function (uri) {
    var p         = path.normalize(uri);
    var basename  = path.basename(p);
    var filename  = Math.floor(Math.random() * 100000);
        filename += '-' + basename;
    
    return filename;
};

titler.isImage = function (contentType) {
    return contentType && contentType.indexOf('image/')    !== -1;
};

titler.isHTML = function (contentType) {
    return contentType && contentType.indexOf('text/html') !== -1;
};

titler.parseHTMLAndGetTitle = function (html, callback) {
    var $     = cheerio.load(html);
    var title = $('title').text();
    
    //console.log('titler.parseHTMLAndGetTitle :: title: ', typeof title, title.length);
    
    if (title && title.length > 0) {
        title = title.replace(/\t\t/g, '');
        title = title.replace(/\t/g, ' ');
        title = title.replace(/\r\n/g, '');
        title = title.replace(/\n/g, ' ');
        title = title.trim();
    } else {
        title = false;
    }
    
    callback(title);
};

titler.getTitle = function (url, callback) {
    if (url) {
        // Parse the URL and see if it's a youtube video    
        var u    = require('url');
        var info = u.parse(url);
        var title;
        
        if (info.host) {            
            // If youtube link, query the API and get extra info about the video
            if (titler.isYoutubeURL(info.host)) {
                // Build title based on API data
                titler.getYoutubeVideoInfo(url, function (data) {              
                    title = titler.getYoutubeTitleFromTemplate(data);
                    
                    callback(title);
                });
            } else {
                var websiteCallback  = function (html) {
                    var isTwitterURL = titler.isTwitterURL(info);
                    
                    if (isTwitterURL) {
                        twitter.getTweet(html, function (tweet) {
                            callback(tweet);
                        });
                    } else {
                        titler.parseHTMLAndGetTitle(html, function (title) {
                            if (title) {
                                title = titler.getTitleFromTemplate(title);
                                
                                callback(title);
                                
                                // How to get log id here?
                                /*
                                historian.updateWebsiteInfo({
                                    
                                });
                                */
                                
                            } else {
                                console.log('titler: error getting title for ', url);
                            }
                        });
                    }
                };
                
                var imageCallback = function (err, img, stderr, length, filename) {
                    var hrfs  = length ? filesize(length, 0) : 0;
                    var msg   = [img.type, 
                                 img.width + 'x' + img.height];
                    
                    if (length) {             
                        msg.push(hrfs);
                    }
                    
                    var title = msg.join(' ');
                    
                    if (err) {
                        console.log('Image info error: ', err);
                    } else {
                        callback(title);
                        fs.unlinkSync(filename);
                        console.log('file deleted: ', filename);
                    }
                };
                
                var errorCallback = function (code) {
                    switch (code) {
                        case 404:
                            var msg = hmp.getMessage({
                                plugin: 'titler',
                                config: titler.wholeConfig,
                                data  : {
                                    code: code
                                },
                                message: '404'
                            });
                            
                            callback(msg);
                        break;
                        
                        default:
                            var msg = hmp.getMessage({
                                plugin: 'titler',
                                config: titler.wholeConfig,
                                data  : {
                                    code: code
                                },
                                message: 'httpError'
                            });
                            
                            callback(msg);
                        break;
                    }
                };
                
                titler.requestWebsite({
                    url            : url,
                    websiteCallback: websiteCallback,
                    imageCallback  : imageCallback,
                    errorCallback  : errorCallback
                });
            }
        } else {
            console.log('titler: error parsing url: ', url);
        }
        
    } else {
        callback('');
    }
};

titler.isTwitterURL = function (info) {
    var isTwitterHost = info.host.indexOf('twitter.com') !== -1;
    var isStatusURL   = false;
    
    if (info.pathname.length > 0) {
        // Accommodate both kinds of URLs
        var isSingleStatus = info.pathname.indexOf('/status/')   !== -1;
        var isMultiStatus  = info.pathname.indexOf('/statuses/') !== -1;
        
        isStatusURL        = isSingleStatus || isMultiStatus;
    }
    
    return isTwitterHost && isStatusURL;
};

titler.getYoutubeVideoTitleDetails = function (json) {
    var data       = json;
    var viewCount  = typeof data.viewCount   !== 'undefined' ? data.viewCount   : 0;
    var rating     = typeof data.rating      !== 'undefined' ? data.rating      : 0;
    var likeCount  = typeof data.likeCount   !== 'undefined' ? data.likeCount   : 0;
    var desc       = typeof data.description !== 'undefined' ? data.description : '';
    var descMaxLen = 199;
    
    // Replace newlines with spaces
    desc = desc.replace(/\n/g, ' ');
    desc = desc.replace(/\r\n/g, ' ');
    
    if (desc.length > descMaxLen) {
        desc = desc.substring(0, descMaxLen).trim() + '...';
    }
    
    var commafy = function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    return {
        title      : ent.decode(data.title),
        description: desc,
        viewCount  : viewCount > 0 ? commafy(viewCount) : 0,
        rating     : rating.toFixed(2),
        likeCount  : likeCount > 0 ? commafy(likeCount) : 0
    };
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
    
    var isShortenedURL      = info.hostname === 'youtu.be';
    // No query string plz
    var shortenedURLVideoID = info.path.substring(1).split('?')[0];
    
    if (query) {
        var qsInfo = qs.parse(info.query);        
        videoID    = qsInfo.v;

        if (typeof videoID === 'undefined' && isShortenedURL) {
            videoID = shortenedURLVideoID
        }
        
    } else {
        if (isShortenedURL) {
            videoID = shortenedURLVideoID;
        }
    }
    
    return videoID;
};

titler.isYoutubeURL = function (host) {
    var looksLikeAYoutubeDomain  = host.indexOf('youtube.') > -1;
    var isShortenedYoutubeDomain = host === 'youtu.be';
    
    return looksLikeAYoutubeDomain || isShortenedYoutubeDomain;
};

titler.getImageInfo = function (path, callback) {
    easyimg.info(path, callback);
};

titler.getUserAgents = function () {
    var def = when.defer();
    var q = [
        'SELECT agent',
        'FROM titler_user_agents',
        'WHERE 1=1',
        'AND enabled = 1'
    ].join("\n");
    
    db.connection.query(q, function (err, result) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

titler.getIgnoredDomains = function () {
    var def = when.defer();
    var q = [
        'SELECT domain',
        'FROM titler_ignored_domains',
        'WHERE 1=1',
        'AND enabled = 1'
    ].join("\n");
    
    db.connection.query(q, function (err, result) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

module.exports = titler;