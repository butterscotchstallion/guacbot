/**
 * admin tests
 *
 */
"use strict";

var moment    = require('moment');
var assert    = require("assert");
var admin     = require('../../plugins/admin');

describe('translate 5m to milliseconds', function () {
    
    it('should translate 5m to ms', function () {
        var input    = '5m';
        var expected = 300000;
        var actual   = admin.timeToMilliseconds(input);
        
        assert.equal(expected, actual);
    });

});