/**
 * admin - provides ability to do things like kick/ban/topic using custom commands
 *
 */
"use strict";

var minimatch = require('minimatch');
var parser    = require('../lib/messageParser');
var admin     = {};

admin.init = function (client) {
    var pluginCfg = client.config.plugins.enabled.admin;
    
    client.addListener('message#', function (nick, to, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        console.log(message);
        
        if (isAddressingBot) {
            var words    = parser.splitMessageIntoWords(text);
            var command  = words[1];
            var triggers = admin.getTriggersFromConfig(pluginCfg);
            var triglen  = triggers.length;
            
            for (var j = 0; j < triglen; j++) {
                if (triggers[j].trigger === command) {
                    admin.executeCommand({
                        client: client,
                        command: triggers[j].command,
                        channel: to,
                        nick: nick,
                        words: words,
                        userInfo: {
                            user: message.user,
                            host: message.host
                        },
                        pluginCfg: pluginCfg
                    });
                }
            }
        }
    });
};

admin.userIsAdmin = function (info) {
    var mask   = info.userInfo.user + '@' + info.userInfo.host;
    var admins = info.pluginCfg.admins;
    var olen   = admins.length;
    var match  = false;
    
    for (var j = 0; j < olen; j++) {
        if (minimatch(mask, admins[j])) {
            console.log('admin owner match: ' + mask + ' == ' + admins[j]);
            
            match = true;
            
        } else {
            console.log('admin owner mismatch: ' + mask + ' != ' + admins[j]);
        }
    }
    
    return match;
};

admin.executeCommand = function (info) {
    // Check if user is authorized to use commands
    if (!admin.userIsAdmin(info)) {
        return false;
    }
    
    switch (info.command) {
        case 'op':
            info.client.send('MODE', info.channel, '+o', info.nick);
        break;
        
        case 'kick':
            info.client.send('KICK', 
                             info.channel, 
                             info.words[2], 
                             // Send everything after the second word
                             info.words.slice(3).join(' '));
        break;
        
        default:
            console.log('admin: unrecognized command: ' + info.command);
        break;
    }
};

admin.getTriggersFromConfig = function (cfg) {
    return cfg.triggers;
};

module.exports = admin;