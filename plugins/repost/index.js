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
var repost = {};

repost.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        repost.isRepost(nick, text, function (rpst) {
            // rpst returns false if nothing was found
            // but also ignore the person saying it
            if (rpst && rpst.nick !== nick) {
                var postDate = moment(rpst.ts).fromNow();
                var msg      = 'posted by ' + rpst.nick + ' ' + postDate;
                    msg     += ' - "' + rpst.message + '"';
                
                client.say(channel, msg);
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
    var urls = input.match(/\b(http|https)?(:\/\/)?(\S*)\.(\w{2,4})\b/ig);
    
    return urls ? urls[0] : false;
};

module.exports = repost;