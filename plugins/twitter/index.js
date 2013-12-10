/**
 * twitter - supplementary plugin to get tweets
 *
 */
"use strict";

var cheerio    = require('cheerio');
var hbs        = require('handlebars');
var twitter    = {};

twitter.init = function (client) {  
    
};

twitter.getTweet = function (html, callback) {
    var info     = twitter.getTweetInfoFromHTML(html);
    var tweet    = twitter.getTweetTemplate(info);
    
    callback(tweet);
};

twitter.getTweetTemplate = function (info) {
    var tweetTpl = '\u0002@{{{author}}}\u0002 :: {{{tweet}}}';
    var tpl      = hbs.compile(tweetTpl);
    
    return tpl(info);
};

twitter.getTweetInfoFromHTML = function (html) {
    var $      = cheerio.load(html);
    var root   = $('.permalink-tweet-container');
    var author = root.find('span.js-action-profile-name > b').first().text();
        author = author.replace('@', '');        
    var tweet  = root.find('.tweet-text').first().text();
        // Bug #65 - newlines in tweets
        tweet  = tweet.replace(/\n/g, " ").trim();
        tweet  = tweet.replace("  ", "").trim();
    
    return {
        author: author,
        tweet : tweet
    };
};

module.exports = twitter;