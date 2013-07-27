/**
 * messageParser - parses message into words and other utilities
 *
 */
"use strict";

var parser = {};

parser.isMessageAddressingBot = function (msg, nick) {
    var words     = parser.splitMessageIntoWords(msg);
    
    // Get the first word, but chop off suffix if the word
    // is longer than the length of the nick
    // example: bot-nick: (a common tab complete character 
    // is the colon/comma, which should not be considered)
    var firstWord = typeof(words[0]) !== 'undefined' ? words[0] : '';
    var fwlen     = firstWord.length;
    var lastChr   = firstWord.slice(-1);
    var suffixes  = [',', ':'];
    
    if (fwlen > nick.length && suffixes.indexOf(lastChr) !== -1) {
        firstWord = firstWord.substring(0, fwlen-1);
    }
    
    return firstWord.toLowerCase() === nick.toLowerCase();    
};

parser.splitMessageIntoWords = function (msg) {
    var w = msg && msg.length > 0 ? msg.split(' ') : [];
    
    if (w.length > 0) {
        // Remove empty elements
        w = w.filter(function (input) {
            return input;
        });
    }
    
    return w;
};

module.exports = parser;