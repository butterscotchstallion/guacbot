/**
 * caps lock saturday - capitalize bots nick and all messages
 * when activated
 *
 */
"use strict";

var cls    = { };
var moment = require('moment');

cls.init = function (client) {
    // User changes nick
    client.addListener('nick', function (oldNick, newNick, channels, message) {
        var clen = channels.length;
        
        for (var j = 0; j < clen; j++) {
            cls.voiceUserIfNickIsUppercase(client, channels[j], newNick);
        }
    });
    
    // User joins channel
    client.addListener('join', function (channel, nick, message) {
        if (nick !== client.config.nick && cls.isSaturday()) {
            cls.voiceUserIfNickIsUppercase(client, channel, nick);
        }
    });
    
    // Received user list from channel
    /*
    client.addListener('names#', function (channel, names) {
        console.log('Received NAMES');
        console.log(names);
        
        var nlen       = names.length;
        
        for (var nick in names) {
            cls.voiceUserIfNickIsUppercase(client, channel, nick);
        }
        
        //client.say('#' + channel, namesArray.join(' '));
    });
    */
    
    // Each time there is a ping, check if it's saturday
    // and if so, change nick
    var oneMinuteInMS = 60000;
    
    setInterval(function () {
        if (cls.isSaturday()) {
            // CLS! uppercase nick
            if (client.currentNick !== client.currentNick.toUpperCase()) {
                cls.capitalizeNick(client, client.currentNick);
            }
        } else {
            // If it's not saturday, lowercase nick
            if (client.currentNick !== client.currentNick.toLowerCase()) {
                cls.lowercaseNick(client, client.currentNick);
            }
        }
    }, oneMinuteInMS);
};

cls.voiceUserIfNickIsUppercase = function (client, channel, nick) {
    // if nick is capitalized, voice
    if (cls.isNickUpperCase(nick)) {
        cls.voiceUser(client, channel, nick);
    } else {
        cls.devoiceUser(client, channel, nick);
    }
};

cls.devoiceUser = function (client, channel, nick) {
    client.send('MODE', channel, '-v', nick);
};

cls.voiceUser = function (client, channel, nick) {
    client.send('MODE', channel, '+v', nick);
};

cls.isSaturday = function () {
    var dayOfWeek = moment().day();
    var saturday  = 6;
    
    return dayOfWeek === saturday;
};

cls.isNickUpperCase = function (nick) {
    return nick === nick.toUpperCase();
};

cls.capitalizeNick = function (client, currentNick) {
    var capitalized    = currentNick.toUpperCase();
    client.currentNick = capitalized;
    
    client.send('NICK', capitalized);
};

cls.lowercaseNick = function (client, currentNick) {
    var lowercase      = currentNick.toLowerCase();
    client.currentNick = lowercase;
    
    client.send('NICK', lowercase);
};

module.exports = cls;