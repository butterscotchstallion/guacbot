/**
 * repost - uses logger plugin to see if a link has been posted before
 * 
 * todo:
 * - ignore list
 * - age threshold
 *
 * Plugin dependencies: logger
 *
 */
"use strict";

var moment = require('moment');
var logger = require('../../plugins/logger');
var ignore = require('../../plugins/ignore');
var repost = {};

repost.init = function (client) {
    client.ame.on('actionableMessage', function (info) {        
        repost.isRepost(info.nick, info.message, function (rpst) {
            // rpst returns false if nothing was found
            // but also ignore the person saying it
            if (rpst && rpst.nick !== info.nick) {
                var postDate = moment(rpst.ts).fromNow();
                var msg      = 'Thanks for posting this again (' + rpst.nick + ' ' + postDate;
                    msg     += ') - "' + rpst.message + '"';
                
                client.say(info.channel, msg);
            }
        });
    });
};

/**
 * Accepts a string, parses out first found URL and searches
 * db for that URL. Returns the last mention of that URL along
 * with information about who said it and when
 *
 */
repost.isRepost = function (nick, input, callback) {
    var url = repost.getFirstURLInString(input);
    
    if (url) {
        //console.log('searching for ' + url);
        
        logger.searchByMessage(nick, url, function (result, err) {
            if (!err) {
                callback(result);
            } else {
                console.log('repost error: ' + err);                
            }
        });
    }
    
    callback(false);
};

repost.getFirstURLInString = function (input) {
    var pattern = new RegExp(
        "(^|[ \t\r\n])((ftp|http|https|gopher|mailto|news|nntp|telnet|wais|file|prospero|aim|webcal):(([A-Za-z0-9$_.+!*(),;/?:@&~=-])|%[A-Fa-f0-9]{2}){2,}(#([a-zA-Z0-9][a-zA-Z0-9$_.+!*(),;/?:@&~=%-]*))?([A-Za-z0-9$_+!*();/?:~-]))"
        ,"g"
    );
    
    var urls = input.match(pattern);
    
    return urls ? urls[0].trim() : false;
};

module.exports = repost;