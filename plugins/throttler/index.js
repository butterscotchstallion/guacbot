/**
 * throttler - track when people did stuff 
 * and make sure they don't do it too much
 *
 */
"use strict";

var minimatch = require('minimatch');
var moment    = require('moment');
var parser    = require('../lib/messageParser');
var throttler = {
    hostmasks: []
};

throttler.init = function (client) {
    throttler.client       = client;
    throttler.pluginConfig = client.config.plugins.throttler;
};

/**
 * Add a hostmask.
 *
 * If it's already there, update the time on each 
 * matching mask
 *
 */
throttler.add = function (info) {
    if (!throttler.isThrottled(info.hostmask)) {
        console.log('not throttled');
        
        if (typeof(info.lastCommandTimestamp) === 'undefined') {
            info.lastCommandTimestamp = moment();
        }
        
        if (typeof(info.commandCount) === 'undefined') {
            info.commandCount = 0;
        }
        
        throttler.hostmasks.push(info);
        
    } else {
        var masks = throttler.hostmasks;
        var mlen  = masks.length;
        var ts    = info.timestamp;
        
        if (!ts) {
            ts    = moment();
        }
        
        console.log('iterating');
        
        // Iterate all masks and update last command time
        for (var j = 0; j < mlen; j++) {
            if (masks[j] && minimatch(info.hostmask, masks[j].hostmask)) {            
                masks[j].lastCommandTimestamp     = ts;
                
                if (typeof(masks[j].commandCount) === 'undefined') {
                    masks[j].commandCount         = 0;
                } else {
                    console.log('incrementing');
                    masks[j].commandCount        += 1;
                }
            }
        }
    }
    
    //console.log(throttler.hostmasks);
};

throttler.isThrottled   = function (hostmask) {
    var masks           = throttler.hostmasks;
    var mlen            = masks.length;
    var isThrottled     = false;
    var maxCmds         = throttler.pluginConfig.maximumCommands;
    var minTimeValue    = throttler.pluginConfig.minimumTimeBetweenCommands.integerValue;
    var minTimeUnit     = throttler.pluginConfig.minimumTimeBetweenCommands.unit;
    var minTimeExceeded = false;
    var maxCmdsExceeded = false;
    var timeDiff        = 0;
    
    for (var j = 0; j < mlen; j++) {
        // First match hostmask
        if (masks[j].hostmask && minimatch(hostmask, masks[j].hostmask)) {
            console.log('match: ' + masks[j].hostmask + ' == ' + hostmask);
            
            // Now check commandCount and calculate the amount of time it's been
            // since the last command was executed
            maxCmdsExceeded = masks[j].commandCount >= maxCmds;
            
            // Returns difference in configured unit, example: seconds
            //timeDiff        = moment().diff(masks[j].lastCommandTimestamp, minTimeUnit);
            timeDiff        = moment().diff(masks[j].lastCommandTimestamp);
            minTimeExceeded = timeDiff > 1;
            
            console.log(' ');
            console.log(' ');
            console.log('timediff:', timeDiff);
            console.log('cmds (' + maxCmds + '):', masks[j].commandCount);
            console.log('time (' + minTimeValue + minTimeUnit + '):', masks[j].commandCount);
            console.log(' ');
            
            if (maxCmdsExceeded && minTimeExceeded) {
                isThrottled = true;
            }
            
            break; 
        }
    }
    
    return isThrottled;
};

module.exports = throttler;