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
            msg      = em.replaceVariables(msg, {
                nick: nick,
                channel: channel,
                by: by,
                reason: reason,
                message: message
        });
        
        client.say(channel, msg);
    });
    
    client.addListener('quit', function (channel, nick, by, reason, message) {
        var messages = em.getQuitMessages(config);
        var msg      = em.getRandomMessage(messages);
            msg      = em.replaceVariables(msg, {
                nick: nick,
                channel: channel,
                by: by,
                reason: reason,
                message: message
        });
        
        client.say(channel, msg);
    });
};

em.replaceVariables = function (msg, kickInfo) {
    var newMsg = '';
    
    newMsg = msg.replace(new RegExp('\\$nick', 'g'), kickInfo.nick);
    newMsg = newMsg.replace(new RegExp('\\$channel', 'g'), kickInfo.channel);
    newMsg = newMsg.replace(new RegExp('\\$by', 'g'), kickInfo.by);
    newMsg = newMsg.replace(new RegExp('\\$reason', 'g'), kickInfo.reason);
    newMsg = newMsg.replace(new RegExp('\\$message', 'g'), kickInfo.message);
    
    return newMsg;
};

em.getRandomMessage = function (messages) {
    var msg = messages[Math.floor(Math.random() * messages.length)];

    return msg;
};

em.getKickMessages = function (cfg) {
    return cfg.plugins.enabled['event-messages'].kick || [];
};

em.getQuitMessages = function (cfg) {
    return cfg.plugins.enabled['event-messages'].quit || [];
};

module.exports = em;
