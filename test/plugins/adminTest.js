/**
 * admin tests
 *
 */
"use strict";

var fs     = require('fs');
var moment = require('moment');
var assert = require("assert");
var admin  = require('../../plugins/admin');
var config = JSON.parse(fs.readFileSync('../bot-config.json', 'utf8'));

describe('admin.parseKickBanCommand', function () {
    beforeEach(function () {
        admin.init({
            config: config,
            addListener: function () {}
        });
    });
    
    it('basic kb', function () {
        var expected = {
            targetNick: 'ndbt',
            targetChannel: '',
            duration: config.plugins.admin.banDuration,
            reason: config.plugins.admin.kickMessages[0]
        };
        
        var cmd    = 'guacamole: kb ndbt';
        var actual = admin.parseKickBanCommand(cmd);
        
        assert.deepEqual(expected, actual);
    });
    
    it('kb with channel', function () {
        var expected = {
            targetNick: 'ndbt',
            targetChannel: '#guacamole',
            duration: config.plugins.admin.banDuration,
            reason: config.plugins.admin.kickMessages[0]
        };
        
        var cmd    = 'guacamole: kb #guacamole ndbt';
        var actual = admin.parseKickBanCommand(cmd);
        
        assert.deepEqual(expected, actual);
    });
    
    it('kb with duration', function () {
        var expected = {
            targetNick: 'ndbt',
            targetChannel: '',
            duration: '5m',
            reason: config.plugins.admin.kickMessages[0]
        };
        
        var cmd    = 'guacamole: kb ndbt 5m';
        var actual = admin.parseKickBanCommand(cmd);
        
        assert.deepEqual(expected, actual);
    });
    
    it('kb with duration and reason', function () {
        var expected = {
            targetNick: 'ndbt',
            targetChannel: '',
            duration: '100m',
            reason: 'squeeze first ask questions last'
        };
        
        var cmd    = 'guacamole: kb ndbt 100m squeeze first ask questions last';
        var actual = admin.parseKickBanCommand(cmd);
        
        assert.deepEqual(expected, actual);
    });
    
    it('kb with channel, duration and reason', function () {
        var expected = {
            targetNick: 'bill',
            targetChannel: '#guacamole',
            duration: '1w',
            reason: 'get bent'
        };
        
        var cmd    = 'guacamole: kb #guacamole bill 1w get bent';
        var actual = admin.parseKickBanCommand(cmd);
        
        assert.equal(expected.targetNick, actual.targetNick);
        assert.equal(expected.targetChannel, actual.targetChannel);
        assert.equal(expected.duration, actual.duration);
        assert.equal(expected.reason, actual.reason);
    });
    
    it('kb with reason', function () {
        var expected = {
            targetNick: 'ndbt',
            targetChannel: '',
            duration: config.plugins.admin.banDuration,
            reason: 'nerd'
        };
        
        var cmd    = 'guacamole: kb ndbt nerd';
        var actual = admin.parseKickBanCommand(cmd);
        
        assert.equal(expected.targetNick, actual.targetNick);
        assert.equal(expected.targetChannel, actual.targetChannel);
        assert.equal(expected.duration, actual.duration);
        assert.equal(expected.reason, actual.reason);
    });
});

describe('translate 5m to milliseconds', function () {
    
    it('should translate 5m to ms', function () {
        var input    = '5m';
        var expected = 300000;
        var actual   = admin.timeToMilliseconds(input);
        
        assert.equal(expected, actual);
    });

});