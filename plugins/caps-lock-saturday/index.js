/**
 * caps lock saturday - capitalize bots nick and all messages
 * when activated
 *
 */
"use strict";

var cls    = { loaded: false };
var moment = require('moment');

cls.init = function (client) {
    // Check once on load before waiting a minute
    if (!cls.loaded) {
        cls.changeNickIfNecessary(client);
        cls.loaded = true;
    }
    
    // Each time there is a ping, check if it's saturday
    // and if so, change nick
    var oneMinuteInMS = 60000;
    
    setInterval(function () {
        cls.changeNickIfNecessary(client);
    }, oneMinuteInMS);
};

cls.changeNickIfNecessary = function (client) {
    if (cls.isSaturday()) {
        // CLS! uppercase nick
        if (!cls.isNickUpperCase(client.currentNick)) {
            cls.capitalizeNick(client, client.currentNick);
        }
    } else {
        // If it's not saturday, lowercase nick
        if (!cls.isNickLowerCase(client.currentNick)) {
            cls.lowercaseNick(client, client.currentNick);
        }
    }
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

cls.isNickLowerCase = function (nick) {
    return nick === nick.toLowerCase();
};

cls.capitalizeNick = function (client, currentNick) {
    //console.log('is saturday! capitalizing nick!');
    
    var capitalized    = currentNick.toUpperCase();
    client.currentNick = capitalized;
    
    client.send('NICK', capitalized);
};

cls.lowercaseNick = function (client, currentNick) {
    //console.log('is NOT saturday! NOT capitalizing nick!');
    
    var lowercase      = currentNick.toLowerCase();
    client.currentNick = lowercase;
    
    client.send('NICK', lowercase);
};

module.exports = cls;