/**
 * log parser test
 *
 */
"use strict";

var assert = require("assert");
var titler = require('../../plugins/titler/');
var parser = require('../../lib/ircLogParser');

describe('parser.parseLine', function () {
    it('should get info about a line', function () {
        var input    = '09/30/13 17:53 <@chillulum> did you see/agree w/ this?';
        
        var expected = {
            nick     : 'chillulum',
            channel  : '#idiots-club',
            ts: '2013-09-30 17:53:00',
            message  : 'did you see/agree w/ this?',
            ic_log_indicator: 1
        };
        
        var actual   = parser.parseLine(input);
        
        assert.deepEqual(expected, actual);
    });
    
    it('should get info about a line pt 2', function () {
        var input    = '09/30/13 17:52 <@n> ^ DEAD SPACE 3 (Zero Punctuation) - Rating: 4.9541445 - Views: 240229 - Likes: 3363';
        
        var expected = {
            nick     : 'n',
            channel  : '#idiots-club',
            ts: '2013-09-30 17:52:00',
            message  : '^ DEAD SPACE 3 (Zero Punctuation) - Rating: 4.9541445 - Views: 240229 - Likes: 3363',
            ic_log_indicator: 1
        };
        
        var actual   = parser.parseLine(input);
        
        assert.deepEqual(expected, actual);
    });
    
    it('should get info about a line pt 3', function () {
        var input    = "09/30/13 17:52 <@mr_sandwich> oh well, will upload";
        
        var expected = {
            nick     : 'mr_sandwich',
            channel  : '#idiots-club',
            ts: '2013-09-30 17:52:00',
            message  : "oh well, will upload",
            ic_log_indicator: 1
        };
        
        var actual   = parser.parseLine(input);
        
        assert.equal(expected.message, actual.message, "message");
        assert.equal(expected.nick, actual.nick, "nick");
        assert.equal(expected.ts, actual.ts, "ts");
        assert.deepEqual(expected, actual);
    });
    
    it('should get info about a line pt 3', function () {
        var input = "04/30/02 21:58 < lol2> TODAY I CAME UP WITH A GREAT ANTI-HOMOPHOBES SLOGAN";
        
        var expected = {
            nick     : 'lol2',
            channel  : '#idiots-club',
            ts: '2002-04-30 21:58:00',
            message  : "TODAY I CAME UP WITH A GREAT ANTI-HOMOPHOBES SLOGAN",
            ic_log_indicator: 1
        };
        
        var actual   = parser.parseLine(input);
        
        assert.deepEqual(expected, actual);
    });
    
    it('should return undefined on invalid input', function () {
        var input    = "04/30/02 21:46 *** Now talking in #MISANTHROPY";
        var expected = undefined;        
        var actual   = parser.parseLine(input);
        
        assert.equal(expected, actual);
    });
    
    it('should return undefined on invalid input', function () {
        var input    = "04/30/02 21:46 *** Set by Nadir on Tue Apr 30 02:15:42";
        var expected = undefined;        
        var actual   = parser.parseLine(input);
        
        assert.equal(expected, actual);
    });
    
});


