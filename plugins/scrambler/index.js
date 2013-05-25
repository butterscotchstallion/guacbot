/**
 * scrambler - unscramble words
 *
 * todo: hint; e.g.  Hint: B _ _ _ _
 *
 * 
 *
 */
"use strict";

var fs = require('fs');
var sc = {
    pluginPath: './plugins/scrambler/'
};

sc.loadConfig = function (cfg) {
    sc.cfg   = cfg.config.plugins.scrambler;    
    sc.words = sc.getWords();
};

sc.init = function (client) {
    sc.loadConfig(client.config);
};

sc.getHint = function (word, counter) {
    var firstLetter = word.substring(0, 1);
    
    return;
};

sc.descramble = function () {
    var wlen         = sc.words.length;
    var sortedWords  = sc.words.sort();
    var scrambled    = sc.getScrambledWord(word);
    var wrongAnswers = [];
    
    console.log(scrambled);
    //console.log(word);
};

sc.getWord = function () {
    return sc.words[Math.floor(Math.random() * sc.words.length)];
};

/**
 * get word list
 *
 */
sc.getWords = function (fixture) {
    var file = sc.cfg.wordsFile;
    var path = sc.pluginPath + file;
    
    if (sc.words) {
        return sc.words;
    }
    
    var data = fs.readFileSync(path, {
        encoding: 'utf8'
    });
    
    if (data.length > 0) {
        var words = data.split("\n");
            
            words = words.map(function (w) {
                return w.trim();
            });
            
            words = words.filter(function (w) {
                return w;
            });
        
        sc.words = words;
        
        return words;
    }
};  

/** 
 * Get a string like b___ if input is "butt"
 * 
 *
sc.getHint = function (input, counter) {
    var placeholder = '_';
    var ilen        = input.length;
    var output      = '';
    
    for (var j = 0; j < ilen; j++) {
        if (j > counter) {
            output += placeholder;
        } else {
            //output += substr(
        }
    }
    
    return output;
}; 
*/

sc.getScrambledWord = function (input) {
    return sc.getShuffledString(input);
};

/* Based on http://stackoverflow.com/a/3943985/124529 */
sc.getShuffledString = function (input) {
    var a = input.split(""),
        n = a.length;
    
    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    
    return a.join("");
};

module.exports = sc;