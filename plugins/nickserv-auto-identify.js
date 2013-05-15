/**
 * Nickserv auto-identify - identifies with nickserv on connect
 * with an optional delay
 *
 */
"use strict";

var ai = {};

ai.init = function (client) {
    var cfg = client.config.plugins.enabled['nickserv-auto-identify'];
    
    // Listen to PMs so we can see if there was an error 
    client.addListener('message', function (nick, to, text, message) {
        if (to === client.config.nick) {
            console.log('PM from ' + nick + ': ' + text);
        }
    });
    
    // On connect...
    client.addListener('registered', function (message) {
        setTimeout(function () {
            
            var pw = cfg.password;
            
            if (pw) {
                console.log('Identifying with nickserv!');
                client.say('nickserv', 'IDENTIFY ' + pw);
            }
            
        }, cfg.delay);
    });
};

module.exports = ai;
