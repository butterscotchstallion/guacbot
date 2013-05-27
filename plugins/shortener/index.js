/**
 * URL shortener plugin - automatically shortens links
 * uses goo.gl and this library:
 * https://github.com/kaimallea/node-googl
 *
 */
"use strict";
var g       = require('goo.gl');
var ignore  = require('../ignore/');
var parser  = require('../../lib/messageParser');
var sh      = {};

sh.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        /**
         * sometimes people have text in the same line as the URL,
         * so split the entire message into words
         * and only get the title of the first URL found
         *
         */
        var words = parser.splitMessageIntoWords(text);
        var wlen  = words.length;
        var word  = '';
        
        for (var j = 0; j < wlen; j++) {
            word = words[j];
            
            // Only try to get source of things that look like a URL
            if (word && sh.matchURL(word)) {
                sh.shorten (word, function (shortenedURL) {
                    if (shortenedURL) {
                        //console.dir(shortenedURL);
                        client.say(channel, '^ ' + shortenedURL.id);
                    }
                });
                
                // Only care about first URL found
                break;
            }
        }
    });
};

sh.matchURL = function (url) {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
    
    return urlPattern.test(url);
};

sh.shorten = function (url, callback) {
    g.shorten(url, callback);
};

module.exports = sh;