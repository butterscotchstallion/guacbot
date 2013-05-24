/**
 * messageParser test
 *
 */
"use strict";

var assert        = require("assert");
var messageParser = require('../../lib/messageParser');
 
describe('messageParser.isMessageAddressingBot', function () {
    it('should not be true when first word contains nick but isnt nick', function () {
        var expected = false;
        var input    = 'sanitary napkin';
        var nick     = 'n';
        var actual   = messageParser.isMessageAddressingBot(input, nick);
        
        assert.equal(expected, actual);
        
        input    = 'amen sista';
        nick     = 'n';
        actual   = messageParser.isMessageAddressingBot(input, nick);
        
        assert.equal(expected, actual);
    });
    
    it('should be true when first word is the nick with a single character after it', function () {
        var expected = true;
        var input    = 'n:';
        var nick     = 'n';
        var actual   = messageParser.isMessageAddressingBot(input, nick);
        
        assert.equal(expected, actual);
    });
    
    it('should be true when first word is the nick', function () {
        var expected = true;
        var input    = 'n';
        var nick     = 'n';
        var actual   = messageParser.isMessageAddressingBot(input, nick);
        
        assert.equal(expected, actual);
    });
});