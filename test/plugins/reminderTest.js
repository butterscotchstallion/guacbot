/**
 * reminder plugin tests
 *
 */
"use strict";

var fs       = require('fs');
var assert   = require("assert");
var reminder = require('../../plugins/reminder/');
var tp       = require('../../lib/timeUnitParser');

describe('reminder time limit', function () {
    it('reminder should not return with invalid input', function () {
        var expected = undefined;
        var input    = '333333333333h';
        var actual   = tp.parseDuration(input);
        
        assert.equal(expected, actual);
    });
    
    it('reminder should return object with valid input', function () {
        var expected = {
            length: 1,
            unit  : 'h'
        };
        var input    = '1h';
        var actual   = tp.parseDuration(input);
        
        assert.deepEqual(expected, actual);
    });
    
    it('reminder should return object with valid input 2', function () {
        var expected = {
            length: 20,
            unit  : 'm'
        };
        var input    = '20m';
        var actual   = tp.parseDuration(input);
        
        assert.deepEqual(expected, actual);
    });
    
    it('reminder should return object with valid input 3', function () {
        var expected = {
            length: 2,
            unit  : 'w'
        };
        var input    = '2w';
        var actual   = tp.parseDuration(input);
        
        assert.deepEqual(expected, actual);
    });
    
    it('reminder should return undefined with invalid input 2', function () {
        var expected = undefined;
        var input    = '200m';
        var actual   = tp.parseDuration(input);
        
        assert.deepEqual(expected, actual);
    });
    
    it('reminder should return undefined with invalid input 3', function () {
        var expected = undefined;
        var input    = '200';
        var actual   = tp.parseDuration(input);
        
        assert.deepEqual(expected, actual);
    });
});