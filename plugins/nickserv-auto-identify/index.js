/**
 * Nickserv auto-identify - identifies with nickserv on connect
 * with an optional delay
 *
 */
"use strict";

var ai = {};

ai.loadConfig = function (cfg) {
    ai.cfg = cfg.plugins['nickserv-auto-identify'];
};

ai.init = function (client) {
    ai.loadConfig(client.config);
    
    // Listen to PMs so we can see if there was an error 
    client.addListener('message', function (nick, to, text, message) {
        if (to === ai.cfg.nick && nick === 'nickserv') {
            console.log('PM from ' + nick + ': ' + text);
        }
    });
    
    // On connect...
    client.addListener('registered', function (message) {
        setTimeout(function () {
            
            var pw = ai.cfg.password;
            
            if (pw) {
                ai.identify(client, pw);
            }
            
        }, ai.cfg.delay);
    });
};

ai.identify = function (client) {
    client.say('nickserv', 'identify ' + ai.cfg.password);
}

module.exports = ai;
