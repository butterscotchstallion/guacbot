/**
 * timeUnitParser - parses a time that looks like this: "5m" == 5 minutes
 *
 */
"use strict";

var parser = {};

parser.parseDuration = function (input) {
    var unit             = input.substring(input.length, input.length - 1);
    var length           = parseInt(input.substring(0, input.length - 1), 10);
    var validUnits       = ['d', 'y', 'm', 's', 'M', 'w', 'h'];
    
    // If the unit is invalid, set it to zero and disregard
    if (isNaN(length) || validUnits.indexOf(unit) === -1) {
        unit   = 0;
        length = 0;
    }
    
    return {
        length: length,
        unit  : unit
    };
};

module.exports = parser;