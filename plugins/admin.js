/**
 * admin - provides ability to do things like kick/ban/topic using custom commands
 *
 * TODO
 * - join
 * - nick change
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
        
        console.log('message: ', message);
        
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
            
            break;
            
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
    
    // message:
    // [0] guacamole:
    // [1] join
    // [2] #test
    var command       = info.words[1];
    var commandArgOne = info.words[2];
    var commandArgTwo = info.words[3];
    
    switch (info.command) {
        case 'op':
            info.client.send('MODE', info.channel, '+o', info.nick);
        break;
        
        case 'kick':
            info.client.send('KICK', 
                             info.channel, 
                             commandArgOne, 
                             // Send everything after the second word
                             info.words.slice(3).join(' '));
        break;
        
        case 'join': 
            info.client.send('JOIN',
                             commandArgOne);
        break;
        
        case 'part':
            info.client.send('PART',
                             commandArgOne,
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