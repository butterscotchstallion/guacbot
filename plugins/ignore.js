/**
 * ignore - ignore by hostmask. other plugins use this to check if the nick
 * asking for something is ignored first
 *
 * TODO:
 * - persist ignores to db
 *
 */
"use strict";

var minimatch = require('minimatch');
var parser    = require('../lib/messageParser');
var ig        = {
    ignored: [
    
    ]
};

ig.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot) {
            var words           = parser.splitMessageIntoWords(text);
            var command         = words[1];
            var hostmask        = words[2];
            
            if (hostmask) {
                if (command === 'ignore') {
                    ig.add(hostmask);
                    
                    client.say(channel, 'k');
                }
                
                if (command === 'unignore') {
                    ig.remove(hostmask);

                    client.say(channel, 'k');
                }
            }
        }    
    });
};

ig.remove = function (hostmask) {
    var iglen   = ig.ignored.length;
    
    for (var j = 0; j < iglen; j++) {
        if (minimatch(hostmask, ig.ignored[j])) {
            delete ig.ignored[j];
        }
    }
    
    console.log(ig.ignored);
};

ig.add = function (hostmask) {
    if (!ig.isIgnored(hostmask)) { 
        ig.ignored.push(hostmask);
    }
    
    console.log(ig.ignored);
};

ig.isIgnored = function (hostmask) {
    var iglen   = ig.ignored.length;
    var ignored = false;
    
    for (var j = 0; j < iglen; j++) {
        if (ig.ignored[j] && minimatch(hostmask, ig.ignored[j])) {
            console.log('hostmask ' + hostmask + ' is now ignored');
            
            ignored = true;
            
            break;
            
        } else {
            console.log('hostmask ' + hostmask + ' is not ignored');
        }
    }
    
    return ignored;
};

module.exports = ig;