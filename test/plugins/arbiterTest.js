/**
 * arbiter - let an irc bot make decisions for you
 *
 */
"use strict";

var arbiter = require('../../plugins/arbiter');
var assert  = require("assert");

describe('aribiter.isDecision should detect decisions', function () {
    
    it('should detect when someone is asking to make a decision', function () {
        var input    = 'chipotle or pizza';
        var expected = true;
        var actual   = arbiter.isDecision(input);
        
        assert.equal(expected, actual);
    });
    
    it('should not detect a phrase less than two words', function () {
        var input    = 'magicks';
        var expected = false;
        var actual   = arbiter.isDecision(input);
        
        assert.equal(expected, actual);
    });
    
    it('should detect comma phrase with or', function () {
        var input    = 'lions, tigers, or bears';
        var expected = true;
        var actual   = arbiter.isDecision(input);
        
        assert.equal(expected, actual);
    });
});

describe('aribiter.applyChoiceSelectionIndicators should indicate which choice was selected', function () {
    
    it('should indicate stuff', function () {
        var input    = ['ella fitzgerald', 'billie holiday'];
        var selected = 'ella fitzgerald';
        var expected = '[✓] ella fitzgerald [ ] billie holiday';
        var actual   = arbiter.applyChoiceSelectionIndicators(input, selected);
        
        assert.equal(expected, actual);
    });
    
    it('should always select a choice', function () {
        var input    = 'joffrey, sansa stark, hodor, or ned stark';
        var actual   = arbiter.decide(input);
        var expected = actual.indexOf('[✓] ') > -1;
        
        assert.equal(expected, true);
    });
    
});

describe('aribiter.selectChoice should pick a choice', function () {
    
    it('should select one choice', function () {
        var input  = ['old dirty bastard', 'method man'];
        var actual = arbiter.selectChoice(input);
        
        assert.equal(input.indexOf(actual) > -1, true);
    });
    
});

describe('aribiter.parse should parse stuff', function () {

    it('should parse with or', function () {
        var input    = 'chipotle or just subs';
        var expected = ['chipotle', 'just subs'];
        var actual   = arbiter.parse(input);
        
        assert.deepEqual(actual, expected);
    });
    
    it('should parse with multiple choices', function () {
        var input    = 'chipotle, subway, chinese or just subs';
        var expected = ['chipotle', 'subway', 'chinese', 'just subs'];
        var actual   = arbiter.parse(input);

        assert.deepEqual(actual, expected);
    });
    
    it('should parse with unspaced comma lists', function () {
        var input    = 'Notorious BIG,Jay Z,Big L,2Pac';
        var expected = input.split(',');
        var actual   = arbiter.parse(input);
        
        assert.deepEqual(actual, expected);
    });
    
});