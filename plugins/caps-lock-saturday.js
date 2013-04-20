/**
 * caps lock saturday - capitalize bots nick and all messages
 * when activated
 *
 */
"use strict";

var cls    = { };
var moment = require('moment');

cls.init = function (client) {
    client.addListener('message#', function (from, to, message) {
        if (message.toLowerCase() === '!cls') {
            cls.capitalizeNick(client, client.config.nick);
        }
    });
    
    client.addListener('names#nodebot', function (names) {
        console.log(names);
    });
    
    // Each time there is a ping, check if it's saturday
    // and if so, change nick
    client.addListener('ping', function () {
        var dayOfWeek = moment().day();
        var saturday  = 6;
        
        if (dayOfWeek === saturday) {
            // Change nick if it's Saturday
            cls.capitalizeNick(client, client.config.nick);
            
            // Voice anyone who has an uppercase nick
            // TODO: maybe this should happen for each channel in config
            //client.send('NAMES', '#nodebot');
            
        } else {
            // If it's not saturday, lowercase nick
            client.send('NICK', client.config.nick.toLowerCase());
        }
    });
};

cls.isNickUpperCase = function (nick) {
    return nick === nick.toUpperCase();
};

cls.capitalizeNick = function (client, currentNick) {
    client.send('NICK', currentNick.toUpperCase());
};

module.exports = cls;