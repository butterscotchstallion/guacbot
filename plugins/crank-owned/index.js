/**
 * crank-owned - response to !crankowned with a random yes/no response
 *
 */
"use strict";
var hmp = require('../../lib/helpMessageParser');
var co  = {
    trigger: '!crankowned'
};

co.reload = function (options) {
    co.loadConfig(options);
};

co.loadConfig = function (options) {
    co.wholeConfig = options.config;
};

co.init = function (options) {
    var client = options.client;
    
    co.loadConfig(options);
    
    options.ame.on('actionableMessage', function (info) {
        if (co.isTrigger(info.message)) {
            client.say(info.channel, co.getIsCrankOwnedMessage(info));
        }
    });
};

co.getIsCrankOwnedMessage = function (info) {
    var messages = hmp.getMessages({
        plugin  : 'crank-owned',
        config  : co.wholeConfig,
        messages: ['yes', 'no', 'maybe', 'error'],
        data    : info
    });
    
    return ~~(Math.random() * 2) === 1 ? messages.yes : messages.no;
};

co.isTrigger = function (input) {
    return input === co.trigger;
};

module.exports = co;