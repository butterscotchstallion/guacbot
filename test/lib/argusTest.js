/**
 * Argus tests
 *
 *
 */
"use strict";

var assert = require("assert");
var argus  = require('../../lib/argus');

describe('argus.addNick', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should have the nick I just added', function () {   
        var input = {
            nick    : 'guacamole',
            channel : '#guacamole',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        };
        var expected = true;
        
        argus.addNick(input);
        
        var actual = argus.nickExists(input);
        
        assert.equal(expected, actual);
    });
});

describe('argus.getNick', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should have the nick I just added', function () {   
        var expected = {
            nick    : 'guacamole',
            channel : '#guacamole',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        };
        
        argus.addNick(expected);
        
        var actual = argus.getNick(expected.nick);
        
        assert.deepEqual(expected, actual);
    });
    
    it('should return undefined if it doesnt have nick', function () {   
        var actual   = argus.getNick('lol');
        var expected = undefined;
        
        assert.deepEqual(expected, actual);
    });
});

describe('argus.getChannelNicks', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should have the nick I just added', function () {   
        argus.addNick({
            nick    : 'guacamole',
            channel : '#guacamole',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        });
        
        argus.addNick({
            nick    : 'hi',
            channel : '#swag',
            modes   : ['+'],
            hostmask: 'guacamole@example.com'
        });
        
        argus.addNick({
            nick    : 'hello',
            channel : '#swag',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        });
        
        argus.addNick({
            nick    : 'jalapeno',
            channel : '#roastbeef',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        });
        
        var expected = [            
            {
                nick    : 'hi',
                channel : '#swag',
                modes   : ['+'],
                hostmask: 'guacamole@example.com'
            },
            {
                nick    : 'hello',
                channel : '#swag',
                modes   : ['@'],
                hostmask: 'guacamole@example.com'
            }
        ];
        
        var actual   = argus.getChannelNicks('#swag');
        
        assert.deepEqual(expected, actual);
    });
    
    it('should have all the nicks I just added', function () {   
        argus.addNick({
            nick    : 'guacamole',
            channel : '#guacamole',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        });
        
        argus.addNick({
            nick    : 'hi',
            channel : '#swag',
            modes   : ['+'],
            hostmask: 'guacamole@example.com'
        });
        
        argus.addNick({
            nick    : 'hello',
            channel : '#swag',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        });
        
        argus.addNick({
            nick    : 'jalapeno',
            channel : '#roastbeef',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        });
        
        var expected = [
            {
                nick    : 'jalapeno',
                channel : '#roastbeef',
                modes   : ['@'],
                hostmask: 'guacamole@example.com'
            }
        ];
        
        var actual   = argus.getChannelNicks('#roastbeef');
        
        assert.deepEqual(expected, actual);
    });
});

describe('argus.removeNick', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should not have nick after removing it', function () {
        var nick = {
            nick    : 'jalapeno',
            channel : '#roastbeef',
            modes   : ['@'],
            hostmask: 'guacamole@example.com'
        };
        
        argus.addNick(nick);
        
        assert.equal(argus.nickExists(nick), true);
        
        argus.removeNick('jalapeno', '#roastbeef');
        
        assert.equal(argus.nickExists(nick), false);
    });
});

describe('argus.hasMode', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should get the correct mode positive', function () {
        var nick = {
            nick    : 'jalapeno',
            channel : '#roastbeef',
            modes   : ['@', '+'],
            hostmask: 'guacamole@example.com'
        };
        
        argus.addNick(nick);
        
        var expected = true;
        var actual   = argus.hasMode({
            nick   : nick.nick,
            channel: nick.channel,
            mode   : '@'
        });
        
        assert.equal(expected, actual);
    });
    
    it('should get the correct mode negative', function () {
        var nick = {
            nick    : 'jalapeno',
            channel : '#roastbeef',
            modes   : ['@', '+'],
            hostmask: 'guacamole@example.com'
        };
        
        argus.addNick(nick);
        
        var expected = false;
        var actual   = argus.hasMode({
            nick   : nick.nick,
            channel: nick.channel,
            mode   : 'bear'
        });
        
        assert.equal(expected, actual);
    });
});

describe('argus.addMode', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should have the mode after adding it', function () {
        var nick = {
            nick    : 'jalapeno',
            channel : '#roastbeef',
            modes   : ['@', '+'],
            hostmask: 'guacamole@example.com'
        };
        
        argus.addNick(nick);
        
        var mode = {
            nick   : nick.nick,
            channel: nick.channel,
            mode   : '@'
        };
        
        argus.addMode(mode);
        
        var expected = true;
        var actual   = argus.hasMode(mode);

        assert.equal(expected, actual);
    });
    
    it('server mode o => @', function () {
        var nick = {
            nick    : 'jalapeno',
            channel : '#roastbeef',
            modes   : [],
            hostmask: 'guacamole@example.com'
        };
        
        argus.addNick(nick);
        
        var mode = {
            nick   : nick.nick,
            channel: nick.channel,
            mode   : 'o'
        };
        
        argus.addMode(mode);
        
        var expected = true;
        var actual   = argus.hasMode({
            nick   : 'jalapeno',
            channel: '#roastbeef',
            mode   : '@'
        });
        
        assert.equal(expected, actual);
    });
    
    it('server mode v => +', function () {
        var nick = {
            nick    : 'jalapeno',
            channel : '#roastbeef',
            modes   : [],
            hostmask: 'guacamole@example.com'
        };
        
        argus.addNick(nick);
        
        var mode = {
            nick   : nick.nick,
            channel: nick.channel,
            mode   : 'v'
        };
        
        argus.addMode(mode);
        
        var expected = true;
        var actual   = argus.hasMode({
            nick   : 'jalapeno',
            channel: '#roastbeef',
            mode   : '+'
        });
        
        assert.equal(expected, actual);
    });
    
    it('server mode h => %', function () {
        var nick = {
            nick   : 'jalapeno',
            channel: '#roastbeef',
            modes  : []
        };
        
        argus.addNick(nick);
        
        var mode = {
            nick   : nick.nick,
            channel: nick.channel,
            mode   : 'h'
        };
        
        argus.addMode(mode);
        
        var expected = true;
        var actual   = argus.hasMode({
            nick   : 'jalapeno',
            channel: '#roastbeef',
            mode   : '%'
        });
        
        assert.equal(expected, actual);
    });
});

describe('argus.removeMode', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should not have the mode after removing it', function () {
        var nick = {
            nick   : 'jalapeno',
            channel: '#roastbeef',
            modes  : ['@']
        };
        
        argus.addNick(nick);
        
        var mode = {
            nick   : nick.nick,
            channel: nick.channel,
            mode   : '@'
        };
        
        argus.removeMode(mode);
        
        var expected = false;
        var actual   = argus.hasMode(mode);
        
        assert.equal(expected, actual);
    });
    
    it('should not have the mode after removing it: o => @', function () {
        var nick = {
            nick   : 'jalapeno',
            channel: '#roastbeef',
            modes  : ['@']
        };
        
        argus.addNick(nick);
        
        var mode = {
            nick   : nick.nick,
            channel: nick.channel,
            mode   : 'o'
        };
        
        argus.removeMode(mode);
        
        var expected = false;
        var actual   = argus.hasMode({
            nick   : nick.nick,
            channel: nick.channel,
            mode   : '@'
        });
        
        assert.equal(expected, actual);
    });
    
    it('should not have the mode after removing it: h => %', function () {
        var nick = {
            nick   : 'jalapeno',
            channel: '#roastbeef',
            modes  : ['@']
        };
        
        argus.addNick(nick);
        
        var mode = {
            nick   : nick.nick,
            channel: nick.channel,
            mode   : 'h'
        };
        
        argus.removeMode(mode);
        
        var expected = false;
        var actual   = argus.hasMode({
            nick   : nick.nick,
            channel: nick.channel,
            mode   : '%'
        });
        
        assert.equal(expected, actual);
    });
    
    it('should not have the mode after removing it: v => +', function () {
        var nick = {
            nick   : 'jalapeno',
            channel: '#roastbeef',
            modes  : []
        };
        
        argus.addNick(nick);
        
        var mode = {
            nick   : nick.nick,
            channel: nick.channel,
            mode   : 'v'
        };
        
        argus.removeMode(mode);
        
        var expected = false;
        var actual   = argus.hasMode({
            nick   : nick.nick,
            channel: nick.channel,
            mode   : '+'
        });
        
        assert.equal(expected, actual);
    });
});

describe('argus.translateMode', function () {
    it('should translate modes', function () {
        var expected, actual;
        
        expected = '@';
        actual   = argus.translateMode('o');
        
        assert.equal(expected, actual);
        
        expected = '+';
        actual   = argus.translateMode('v');
        
        assert.equal(expected, actual);
        
        expected = '%';
        actual   = argus.translateMode('h');
        
        //expected = 'a';
        //actual   = argus.translateMode('&');
        //assert.equal(expected, actual);
    });
});


describe('argus.getNickByChannel', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should get nick', function () {
        argus.addNick({
            nick   : 'jalapeno',
            channel: '#roastbeef',
            modes  : []
        });
        
        argus.addNick({
            nick   : 'scallop',
            channel: '#swiss',
            modes  : []
        });
        
        argus.addNick({
            nick   : 'jalapeno',
            channel: '#swiss',
            modes  : []
        });
        
        var expected = {
            nick   : 'jalapeno',
            channel: '#roastbeef',
            modes  : []
        };
        
        var actual  = argus.getNickByChannel({
            nick   : 'jalapeno',
            channel: '#roastbeef'
        });
        
        assert.deepEqual(expected, actual);
    });
});

describe('argus.getNickWithoutHostmask', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should find nicks without hostmasks', function () {
        // Without
        var nickWithoutHostmask = {
            nick   : 'scallop',
            channel: '#swiss',
            modes  : []
        };
        
        argus.addNick(nickWithoutHostmask);
        
        var n = argus.getNickWithoutHostmask();
        
        assert.deepEqual(nickWithoutHostmask, n);
    });
    
    it('should not find nicks with hostmasks', function () {            
        // With
        var nickWithHostmask = {
            nick    : 'scallop',
            channel : '#swiss',
            modes   : [],
            hostmask: 'scallop@fish.com'
        };
        
        argus.addNick(nickWithHostmask);
        
        var n = argus.getNickWithoutHostmask();
        
        assert.equal(typeof n, 'undefined');
    });
});

describe('argus.updateHostmask', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should update hostmask', function () {
        var nickWithoutHostmask = {
            nick    : 'scallop',
            channel : '#swiss',
            modes   : []
        };
        
        argus.addNick(nickWithoutHostmask);
        
        argus.updateHostmask({
            nick    : 'scallop',
            hostmask: 'can-i-live@brooklyn.com'
        });
        
        var n        = argus.getNickWithoutHostmask();
        var expected = {
            nick    : 'scallop',
            channel : '#swiss',
            modes   : [],
            hostmask: 'can-i-live@brooklyn.com'
        };
        
        assert.equal(typeof n, 'undefined');
        assert.deepEqual(argus.channels[0], expected);
    });
});

describe('argus.botHasOpsInChannel', function () {
    beforeEach(function () {
        argus.channels = [];
    });
    
    it('should detect ops', function () {
        var botWithoutOps = {
            nick    : 'guacamole',
            channel : '#guacamole',
            modes   : []
        };
        
        argus.addNick(botWithoutOps);
        
        var expected = false;
        var actual   = argus.botHasOpsInChannel('#guacamole', 'guacamole');
        
        assert.equal(expected, actual);
        
        // Now add ops
        argus.addMode({
            nick   : 'guacamole',
            channel: '#guacamole',
            mode   : 'o'
        });
        
        var expected = true;
        var actual   = argus.botHasOpsInChannel('#guacamole', 'guacamole');
        
        assert.equal(expected, actual);
    });
    
    it('should detect when bot does not have ops', function () {
        var botWithoutOps = {
            nick    : 'guacamole',
            channel : '#guacamole',
            modes   : ['@']
        };
        
        argus.addNick(botWithoutOps);
        
        var expected = true;
        var actual   = argus.botHasOpsInChannel('#guacamole', 'guacamole');
        
        assert.equal(expected, actual);
        
        // Now remove ops
        argus.removeMode({
            nick   : 'guacamole',
            channel: '#guacamole',
            mode   : 'o'
        });
        
        var expected = false;
        var actual   = argus.botHasOpsInChannel('#guacamole', 'guacamole');
        
        assert.equal(expected, actual);
    });
});