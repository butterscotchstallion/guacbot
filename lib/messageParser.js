/**
 * messageParser - parses message into words and other utilities
 *
 */
"use strict";

var parser = {};

parser.isMessageAddressingBot = function (msg, nick) {
    var words     = parser.splitMessageIntoWords(msg);
    
    // Get the first word, but chop off last character if the word
    // is longer than the length of the nick
    // example: bot-nick: (a common tab complete character is the colon,
    // which should not be considered)
    // it could also be a comma, so just remove the last character
    var firstWord = typeof(words[0]) !== 'undefined' ? words[0] : '';
    var fwlen     = firstWord.length;
    
    if (fwlen > nick.length) {
        firstWord = firstWord.substring(0, fwlen-1);
    }
    
    return firstWord === nick;    
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