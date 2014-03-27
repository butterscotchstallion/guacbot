/**
 * crank-owned - response to !crankowned with a random yes/no response
 *
 */
"use strict";
var irc = require('irc');
var co  = {
    trigger: '!crankowned'
};

co.init = function (options) {
    var client = options.client;
    
    options.ame.on('actionableMessage', function (info) {
        if (co.isTrigger(info.message)) {
            client.say(info.channel, co.getIsCrankOwnedMessage());
        }
    });
};

co.getIsCrankOwnedMessage = function () {
    var owned    = irc.colors.wrap('light_red',   'Yes, crank is currently owned!');
    var notOwned = irc.colors.wrap('light_green', 'No, crank is currently not owned.');
    
    return Math.floor(Math.random() * 2) === 1 ? owned : notOwned;
};

co.isTrigger = function (input) {
    return input === co.trigger;
};

module.exports = co;