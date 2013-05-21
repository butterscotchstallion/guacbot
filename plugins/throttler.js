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
    hostmasks: [],
    
    // example: 1 command per second
    minimumTimeBetweenCommands: '1s',
    maximumCommands: 1
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
        throttler.hostmasks.push(info);
    } else {
        var masks = throttler.hostmasks;
        var tlen  = masks.length;
        var ts    = info.timestamp;
        
        if (!ts) {
            ts    = moment();
        }
        
        // Iterate all masks and update last command time
        for (var j = 0; j < tlen; j++) {
            if (masks[j] && minimatch(info.hostmask, masks[j].hostmask)) {            
                masks[j].lastCommandTimestamp = ts;
            }
        }
    }
};

throttler.isThrottled = function (hostmask) {
    var masks       = throttler.hostmasks;
    var tlen        = masks.length;
    var isThrottled = false;
    
    for (var j = 0; j < tlen; j++) {
        //console.log('mask:', hostmask);
        //console.log('masks[j]:', hostmask);
        
        if (masks[j].hostmask && minimatch(hostmask, masks[j].hostmask)) {            
            isThrottled = true;
            
            break; 
        }
    }
    
    return isThrottled;
};

module.exports = throttler;