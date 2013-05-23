/**
 * messageParser - parses message into words and other utilities
 *
 */
"use strict";

var parser = {};

parser.isMessageAddressingBot = function (msg, nick) {
    var words = parser.splitMessageIntoWords(msg);
    
    return typeof(words[0]) !== 'undefined' ? words[0].indexOf(nick) > -1 : false;    
};

parser.splitMessageIntoWords = function (msg) {
    var w = msg.split(' ');
    
    // Remove empty elements
    w = w.filter(function (input) {
        return input;
    });
    
    return w;
};

module.exports = parser;