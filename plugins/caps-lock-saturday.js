/**
 * caps lock saturday - capitalize bots nick and all messages
 * when activated
 *
 */
"use strict";

var cls = { };
cls.client = undefined;

cls.init   = function (cfg) {
    cls.client = cfg.client;
};

cls.capitalizeNick = function (currentNick) {
    var upperCaseNick = currentNick.toUpperCase();
    var lowerCaseNick = currentNick.toLowerCase();
    var newNick       = upperCaseNick;
    
    if (currentNick === upperCaseNick) {
        newNick = lowerCaseNick;
    } else {
        newNick = upperCaseNick;
    }
    
    cls.client.send('NICK', newNick);
};

module.exports = cls;