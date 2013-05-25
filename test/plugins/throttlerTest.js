/**
 * throttler - limit command execution by time
 *
 * updateLastCommand (command, time = null) 
 * isThrottled (hostmask)
 *
 */
"use strict";

var moment    = require('moment');
var assert    = require("assert");
var throttler = require('../../plugins/throttler');

/*
describe('throttler command count', function () {
    beforeEach(function () {
        throttler.hostmasks = [];
        throttler.pluginConfig = {
            "minimumTimeBetweenCommands": {
                "integerValue": 1,
                "unit": "seconds"
            },
            "maximumCommands": 1
        };
    });
    
    it('should correctly check isThrottled given a time', function () {
    
        for (var j = 0; j < 4; j++) {
            throttler.add({
                hostmask: '*@example.com',
                timestamp: moment()
            });
        }
        
        var isThrottled = false;
        var masks       = throttler.hostmasks;
        var mlen        = masks.length;
        
        for (var j = 0; j < mlen; j++) {
            isThrottled = throttler.isThrottled(masks[j].hostmask);
            
            assert.equal(isThrottled, true);
        }
        
        console.dir(throttler.hostmasks);
    });
});
*/

describe('throttler.add', function () {
    beforeEach(function () {
        throttler.hostmasks = [];
        throttler.pluginConfig = {
            "minimumTimeBetweenCommands": {
                "integerValue": 1,
                "unit": "seconds"
            },
            "maximumCommands": 1
        };
    });
    
    it('should be in the hostmask array after adding', function () {
    
        for (var j = 0; j < 2; j++) {
            throttler.add({
                hostmask: '*@example.com'
            });
        }
        
        var masks    = throttler.hostmasks;        
        var expected = true;
        var actual   = throttler.isThrottled('lol@example.com');
        
        assert.equal(expected, actual);
    });
    
    /*
    it('should not add an existing hostmask', function () {
        throttler.add({
            hostmask: '*@example.com'
        });
        
        throttler.add({
            hostmask: 'foo@example.com'
        });
        
        throttler.add({
            hostmask: 'biggie-smalls-is-the-illest@example.com'
        });
        
        var masks    = throttler.hostmasks;
        var expected = true;
        var actual   = masks.length === 1;
        
        assert.equal(expected, actual);
    });
    */
});
    