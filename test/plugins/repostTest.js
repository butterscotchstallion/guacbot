/**
 * repost tests
 *
 */
"use strict";

var assert = require("assert");
var repost = require('../../plugins/repost');

describe('repost.getFirstURLInString', function () {
    it('should find the first URL in a string', function () {
        var input    = 'Bender? Have you seen my http://sombrero.com here is another url http://google.com?';
        var expected = 'http://sombrero.com';
        var actual   = repost.getFirstURLInString(input);
        
        assert.equal(expected, actual);
    });
    
    it('should not find any URLs in a string with no URLs', function () {
        var input    = "I'll save you nibbler!";
        var expected = false;
        var actual   = repost.getFirstURLInString(input);
        
        assert.equal(expected, actual);
    });
});