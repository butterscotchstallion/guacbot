

"use strict";

var db = require('../db/');
var fs = require('fs');
var p  = {};

p.readWordsFile = function (file, callback) {
    var words  = fs.readFileSync(file, 'utf8');
    var output = words.split("\n");
    var olen   = output.length;
    
    output = output.map(function (input) {
        return input.trim();
    });
    
    callback(output);
};

p.addWordsToDB = function (words, callback) {
    var wlen   = words.length;
    var query  = 'INSERT INTO scrambler_words (word) VALUES ';
    var params = [];
    var pairs  = [];
    
    for (var j = 0; j < wlen; j++) {
        pairs.push('(?)');
        params.push(words[j].trim());
    }
    
    query += pairs.join(',');
    
    db.connection.query(query, params, function (err, result) {
        callback(result, err);
    });
};

var cfg = JSON.parse(fs.readFileSync('./bot-config.json', 'utf8'));

db.init({
    config: cfg
});

p.readWordsFile('./plugins/scrambler/long-with-consonants.txt', function (words) {
    p.addWordsToDB(words, function (result, err) {
        console.log(err);
        console.log(result);
    });
});

module.exports = p;