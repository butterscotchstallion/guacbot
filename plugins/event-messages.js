/**
 * event-messages - say things when people are kicked or quit
 *
 * TODO
 * - variables in messages like $nick
 * - random selection of messages from config
 *
 */
'use strict';

var em = {};

em.init = function (client, config) {
    client.addListener('kick', function (channel, nick, by, reason, message) {
        var messages = em.getKickMessages(config);
        var msg      = em.getRandomMessage(messages);
        
        client.say(channel, msg);
    });
    
    client.addListener('quit', function (channel, nick, by, reason, message) {
        var messages = em.getQuitMessages(config);
        var msg      = em.getRandomMessage(messages);
        
        client.say(channel, msg);
    });
};

em.getRandomMessage = function (messages) {
    return messages[Math.floor(Math.random() * messages.length)];
};

em.getKickMessages = function (cfg) {
    return cfg.plugins.enabled['event-messages'].kick || [];
};

em.getQuitMessages = function (cfg) {
    return cfg.plugins.enabled['event-messages'].quit || [];
};

module.exports = em;
