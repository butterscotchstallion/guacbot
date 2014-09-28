/**
 * stuff-hunt - text game based on reaction speed
 *
 */
"use strict";

var moment        = require('moment');
var hmp           = require('../../lib/helpMessageParser');
var db            = require('../../lib/db');
var admin         = require('../../plugins/admin');
var oneMinuteInMS = 60000;
var hunt          = {
    inProgress   : false,
    huntTimeLimit: oneMinuteInMS
};

hunt.loadConfig   = function (options) {
    hunt.client      = options.client;
    hunt.wholeConfig = options.config;
};

hunt.reload = function (options) {
    hunt.loadConfig(options);
};

hunt.init = function (options) {
    var client = options.client;
    
    hunt.loadConfig(options); 
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        switch (info.command) {
            case "starthunt":
                hunt.startHunt({
                    channel: options.channel
                });
            break;
            
            case "bang":
                if (hunt.inProgress) {
                    hunt.endHunt({
                        hunter : nick,
                        channel: options.channel
                    });
                } else {
                    // hunt not in progress, kick.               
                    message = hmp.getMessage({
                        plugin : 'stuff-hunt',
                        config : hunt.wholeConfig,
                        message: ['huntNotInProgressKickMessage'],
                        data   : options
                    });
                    
                    admin.kick(info.channel, info.nick, message);
                }
            break;
        }
    });
};

hunt.endHunt = function (options) {
    var huntTimedOut = options === false;
    var message;
    
    if (huntTimedOut) {
        message = hmp.getMessage({
            plugin : 'stuff-hunt',
            config : hunt.wholeConfig,
            message: ['timeout'],
            data   : options
        });
        
        hunt.client.say(options.channel, message);
        
    } else {
        message = hmp.getMessage({
            plugin : 'stuff-hunt',
            config : hunt.wholeConfig,
            message: ['huntEnded'],
            data   : options
        });
        
        // display scores
        hunt.client.say(options.channel, message);
        
        hunt.saveScores();
    }
};

hunt.saveScores = function () {

};

hunt.sendWarning = function (options) {
    var message = hmp.getMessage({
        plugin : 'stuff-hunt',
        config : hunt.wholeConfig,
        message: ['warning']
    });
    
    hunt.client.say(options.channel, message);    
};

hunt.startHuntCountdown = function () {
    setTimeout(function () {
        
        /**
         * If the hunt is in progress when the timer expires, then nobody
         * succeeded. Sending false is an indication of this scenario.
         *
         */
        if (hunt.inProgress) {
            hunt.endHunt(false);
        }
    
    }, hunt.huntTimeLimit);
};

hunt.startHunt = function (options) {
    if (!hunt.inProgress) {
        hunt.startTime = moment();
        
        hunt.sendWarning(options);
        hunt.startHuntCountdown();
    }
};

module.exports = hunt;




