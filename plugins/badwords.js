/**
 * badwords - kick/ban/message on badword sighting
 *
 * NOTE: this plugin depends on the admin plugin
 *
 */
"use strict";

var admin = require('./admin');
var bw    = {};

bw.init = function (client) {
    bw.cfg    = client.config.plugins.badwords;
    
    client.addListener('message#', function (nick, channel, text, message) {
        var words                   = bw.cfg.words || [];
        var messageContainsBadWords = bw.messageContainsBadWords(words, text);
        var actions                 = bw.cfg.actions.split(',');
        
        if (messageContainsBadWords) {  
            var alen = actions.length;
            
            for (var j = 0; j < alen; j++) {
                bw.performAction(actions[j], channel, nick);
            }
        }
    });
};

bw.performAction = function (action, channel, nick) {
    switch (action) {
        case "ban":
            admin.ban(channel, nick);
            bw.kickWithMessage(channel, nick);
        break;
        
        case "kick":
            bw.kickWithMessage(channel, nick);
        break;
        
        case "mute":
            admin.mute(channel, nick, bw.cfg.muteDuration);
        break;
        
        case "say":
            var message = bw.getReplyMessage();
            admin.client.say(channel, message);
        break;
        
        default:
            console.log('badwords: unknown action');
        break;
    }
};

bw.getReplyMessage = function () {
    var messages =  bw.cfg.replyMessages || [];
    var message  = 'Bad word.';
    
    if (messages) {
        message = messages[Math.floor(Math.random() * messages.length)];
    }
    
    return message;    
};



bw.kickWithMessage = function (channel, nick) {
    var messages =  bw.cfg.kickMessages || [];
    var message  = 'Bad word.';
    
    if (messages) {
        message = messages[Math.floor(Math.random() * messages.length)];
    }
    
    admin.kick(channel, nick, message);
};

bw.messageContainsBadWords = function (words, message) {
    var wlen  = words.length;
    var found = false;
    
    for (var j = 0; j < wlen; j++) {
        if (message.indexOf(words[j]) > -1) {
            found = true;
            break;
        }
    }
    
    return found;
};

module.exports = bw;