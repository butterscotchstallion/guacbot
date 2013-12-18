/**
 * math - evaluate math expressions
 *
 */
"use strict";
var math = require('mathjs')();
var m    = {};

m.init = function (client) {
    m.client = client;
    
    client.ame.on('actionableMessageAddressingBot', function (info) {
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
                m.handleErrorParsingInput(e);
            }
        }
    });
};

m.handleErrorParsingInput = function (e) {
    var msg = 'error, lol';
    
    if (typeof e !== 'undefined') {
        console.log(e);
        
        msg += ' ' + e;
    }
    
    m.client.say(info.channel, msg);
};

m.eval = function (input) {
    return math.eval(input);
};

module.exports = m;
