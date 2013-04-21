/**
 * messageParser - parses message into words and other utilities
 *
 */
"use strict";

var parser = {};

parser.isMessageAddressingBot = function (msg, nick) {
    var words = parser.splitMessageIntoWords(msg);
    
    return words[0].indexOf(nick) > -1;    
};

parser.splitMessageIntoWords = function (msg) {
    return msg.split(' ');
};

module.exports = parser;