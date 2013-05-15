/**
 * news - periodically show headlines from various news sites
 *
 */
"use strict";

var fs         = require('fs');
var FeedParser = require('feedparser')
var request    = require('request');
var parser     = require('../lib/messageParser');
var news       = {};

news.init = function (client) {    
    client.addListener('message#', function (from, to, message) {
        var words           = parser.splitMessageIntoWords(message);
        var isAddressingBot = parser.isMessageAddressingBot(message, client.config.nick);
        
        if (isAddressingBot && words[1] === 'news') {
            console.log('newsing');
            
            news.getNews(function (headline) {
                console.log(headline);
                //client.say(from, headline);
            });
        }
    });
};

news.getNews = function (callback) {
    console.log('getting news');
    
    //fs.readFileSync('test/fixture/infowars.rss')
    request('http://drudgereportfeed.com/rss.xml')
        .pipe(new FeedParser())
        .on('error', function(error) {
            console.log('News reader error: ' + error);
        })
        .on('channel', function (item) {
            callback(item);
        });
};

module.exports = news;
