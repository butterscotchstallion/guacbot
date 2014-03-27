/**
 * math - evaluate math expressions
 *
 */
"use strict";
var math = require('mathjs')();
var m    = {};

m.init = function (options) {
    m.client   = options.client;
    var client = options.client;
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        if (info.command === 'calc') {
            try {
                var input = info.words.slice(2).join(' ').trim();
                
                if (input.length > 0) {
                    var msg   = [input, m.eval(input)].join(' = ');
                    
                    client.say(info.channel, msg);
                } else {
                    client.say(info.channel, 'Usage: calc <expression>');
                }
                
            } catch (e) {
                m.handleErrorParsingInput(e, info);
            }
        }
    });
};

m.handleErrorParsingInput = function (e, info) {
    var msg = 'error, lol';
    
    if (e) {
        console.log(e);
    }
    
    m.client.say(info.channel, msg);
};

m.eval = function (input) {
    return math.eval(input);
};

module.exports = m;
