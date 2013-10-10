/**
 * tests for crank-owned plugin
 *
 */
"use strict";

var assert = require("assert");
var co     = require('../../plugins/crank-owned');

describe('co.detectTrigger', function () {
    it('should detect trigger', function () {
        var expected = true;
        var input    = '!crankowned';
        var actual   = co.messageStartsWithTrigger(input);
        
        assert.equal(expected, actual);
    });
    
    it('should not detect trigger when its not in the beginning of the string', function () {
        var expected = false;
        var input    = 'I like turtles !crankowned';
        var actual   = co.messageStartsWithTrigger(input);
        
        assert.equal(expected, actual);
    });
    
    it('should not detect trigger when its not there', function () {
        var expected = false;
        var input    = 'ya best protect ya neck';
        var actual   = co.messageStartsWithTrigger(input);
        
        assert.equal(expected, actual);
    });
});