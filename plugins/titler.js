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

titler.getPageHTML = function (url, callback) {
    console.log('Retrieving page HTML for URL: ' + url);
    
    var request = require('request');
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(body);
        }
    });
};

titler.getTitle = function (url, callback) {
    
    titler.getPageHTML(url, function (html) {
        console.log('parsing title out of HTML');
        console.log(html);
        
        var re    = /(<\s*title[^>]*>(.+?)<\s*\/\s*title)>/gi;
        var match = re.exec(html);
        
        if (match && match[2]) {
            // Decode HTML entities in title
            var ent   = require('ent');
            var title = ent.decode(match[2]);
            
            callback(title);
        } else {
            console.log('Failed to find title in html!');
            console.log(match);
            
            return false;
        }
    });
};

module.exports = titler;