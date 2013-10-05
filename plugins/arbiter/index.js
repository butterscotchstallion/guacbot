/**
 * arbiter - makes decisions for you
 *
 */
"use strict";

var arbiter = {};
var parser  = require('../../lib/messageParser');
var ignore  = require('../../plugins/ignore/');

arbiter.init = function (client) {
    client.ame.on('actionableMessageAddressingBot', function (info) {        
        var words      = parser.splitMessageIntoWords(info.message);
        var choiceTxt  = words.slice(1).join(' ');
        var isDecision = arbiter.isDecision(info.message);
        
        if (isDecision) {
            var output = arbiter.decide(choiceTxt);
            
            if (output) {
                client.say(info.channel, output);
            } else {
                client.say(info.channel, 'idk lol');
            }
        }
    });
};

arbiter.decide = function (input) {
    var choices = arbiter.parse(input);
    var output  = '';
    
    if (choices) {
        var selected = arbiter.selectChoice(choices);
        output       = arbiter.applyChoiceSelectionIndicators(choices, selected);
    }
    
    return output;
};

arbiter.selectChoice = function (choices) {
    return choices[Math.floor(Math.random() * choices.length)];
};

/**
 * Prepends each choice with an indicator of whether it was chosen
 *
 */
arbiter.applyChoiceSelectionIndicators = function (choices, selected) {
    var clen              = choices.length;
    var output            = '';
    var indicator         = '[ ] ';
    var selectedIndicator = '[✓] ';
    
    for (var j = 0; j < clen; j++) {
        if (choices[j]) {
            if (choices[j] === selected) {
                output += selectedIndicator;
            } else {
                output += indicator;
            }
            
            output += choices[j];
            
            if (j < clen - 1) {
                output += ' ';
            }
        }
    }
    
    return output;
};

/**
 * Check if a phrase is a decision
 *
 */
arbiter.isDecision = function (input) {
    var hasOr = input.indexOf(' or ') > -1;
    
    return hasOr;    
};

/**
 * Parses a question like "chipotle or just subs" and returns
 * an array of the possible choices, with a random one chosen
 * as denoted by the prefix [x]
 *
 * example: billulum:  guacamole, chipotle or just subs
 *          guacamole: billulum, [x] chipotle [ ] just subs
 *
 * First split by the word " or " for simple decisions
 * and then split by commas, in case there are several choices
 *
 *
 */
arbiter.parse = function (input) {
    var choices      = [];
    var commaChoices = [];
    
    // Split by commas first
    if (input.indexOf(',') > -1) {
        commaChoices = input.split(',');        
        choices      = choices.concat(commaChoices);
    }
    
    // The initial split result looks like this
    // [ 'chipotle', ' subway', ' chinese or just subs' ]
    // So now split the last element of that array by 'or'
    if (choices.length > 0) {
        var lastChoice = choices[choices.length-1]
    
        if (lastChoice.indexOf(' or ') > -1) {
            var orChoices  = choices.pop().split(' or ');
            choices        = choices.concat(orChoices);
        }
        
    } else {
        // Simple binary choice
        if (input.indexOf(' or ') > -1) {
            choices = input.split(' or ');
        }
    }
    
    // Finally, trim whitespace on each choice
    if (choices) {
        choices = choices.map(function (c) {
            return c.trim();
        });
        
        // Remove blank elements
        choices = choices.filter(function (input) {
            return input;
        });
    }
    
    return choices;
};

module.exports = arbiter;