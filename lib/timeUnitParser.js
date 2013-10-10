/**
 * timeUnitParser - parses a time that looks like this: "5m" == 5 minutes
 *
 */
"use strict";

var parser = {};

parser.parseDuration = function (input) {
    var unit             = input.substring(input.length, input.length - 1);
    var duration         = parseInt(input.substring(0, input.length - 1), 10);
    var validUnits       = ['d', 'y', 'm', 's', 'M', 'w', 'h'];
    var isValidUnit      = validUnits.indexOf(unit) !== -1;
    var isValidDuration  = !isNaN(duration) && duration.toString().length <= 2;
    var isValid          = isValidUnit && isValidDuration;
    
    // If the unit is invalid, set it to zero and disregard
    if (isValid) {
        return {
            length: duration,
            unit  : unit
        };
    }
};

module.exports = parser;