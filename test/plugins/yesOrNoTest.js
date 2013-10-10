/**
 * y/n tests
 *
 */
"use strict";

var assert = require("assert");
var yn     = require('../../plugins/yes-or-no/');

describe('yn.isYesOrNoQuestion', function () {
    it('should detect questions', function () {
        var expected = true;
        var input    = 'should I wash my cat y/n';
        var actual   = yn.isYesOrNoQuestion(input);
        
        assert.equal(expected, actual);
    });
    
    it('should not detect non-questions', function () {
        var expected = false;
        var input    = 'butternut squash';
        var actual   = yn.isYesOrNoQuestion(input);
        
        assert.equal(expected, actual);
    });
});