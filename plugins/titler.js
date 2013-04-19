/**
 * Titler - matches URL patterns in the channel and returns the title
 * of that page
 *
 */
"use strict";

var titler = { };

titler.matchURL = function (url) {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
    
    return urlPattern.test(url);
};

titler.getURLInfo = function (url) {
    var u = require('url');

    return u.parse(url);
};

titler.getPageHTML = function (url) {
    var urlInfo = titler.getURLInfo(url);
    var http    = require('http');
    var options = {
        host: urlInfo.host,
        path: urlInfo.path,
        port: urlInfo.port
    };
    
    try {
        http.get(options, function (response) {
            response.on('data', function (chunk) {
                return titler.getTitle(chunk.toString());
            });
        });
        
    } catch (e) {
        console.log(e);
    }
};

titler.getTitle = function (html) {
    var shortenedHTML = html.substring(0, 500);
    
    console.log(shortenedHTML);
    
    var re    = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
    var match = re.exec(shortenedHTML);
    
    if (match && match[2]) {
        return match[2];
    } else {
        console.log('Failed to find title in html!');
        console.log(match);
    }
};

module.exports = titler;