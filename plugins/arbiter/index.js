/**
 * arbiter - makes decisions for you
 *
 */
"use strict";

var parser  = require('../../lib/messageParser');
var ignore  = require('../../plugins/ignore/');
var when    = require('when');
var db      = require('../../lib/db');
var _       = require('underscore');
var arbiter = {};

arbiter.loadConfig = function (config) {
    arbiter.getAnswers()
           .then(function (answers) {
                var a = _.pluck(answers, 'answer');
                
                arbiter.config = _.extend(config, {
                    answers: a
                });
           })
           .catch(function (e) {
            console.log(e.stack);
           });
};

arbiter.init = function (options) {
    var client = options.client;
    
    arbiter.loadConfig(options.config.plugins.arbiter);
    
    options.ame.on('actionableMessageAddressingBot', function (info) {        
        var words             = info.words;
        var choiceTxt         = words.slice(1).join(' ');
        var isDecision        = arbiter.isDecision(info.message);
        var isYesOrNoQuestion = arbiter.isYesOrNoQuestion(info.message);
        
        if (isDecision) {
            var output = arbiter.decide(choiceTxt);
            
            if (output) {
                client.say(info.channel, output);
            } else {
                client.say(info.channel, 'idk lol');
            }
        } else if (isYesOrNoQuestion) {
            var answer = arbiter.getAnswer();
            
            if (answer) {
                client.say(info.channel, answer);
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

arbiter.getAnswers = function () {
    var cols  = ['answer'];
    var def   = when.defer();
    var query = [
        'SELECT ',
        cols.join(','),
        'FROM arbiter_answers',
        'WHERE enabled = 1'
    ].join("\n");
    
    db.connection.query(query, function (err, result) {
        if (err && result) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

arbiter.getAnswer = function () {
    var a = arbiter.config.answers || [];

    if (a.length > 0) {
        return a[~~(Math.random() * a.length)];
    }
};

arbiter.isYesOrNoQuestion = function (input) {
    return input.indexOf('y/n') !== -1;
};

module.exports = arbiter;