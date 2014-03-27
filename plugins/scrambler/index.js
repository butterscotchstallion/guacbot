/**
 * scrambler - unscramble words
 *
 * todo: hint; e.g.  Hint: B _ _ _ _
 *
 * 
 *
 */
"use strict";

var fs     = require('fs');
var _      = require('underscore');
var hbs    = require('handlebars');
var moment = require('moment');
var define = require('../../plugins/define');
var sc     = {
    words             : [],
    
    pluginPath        : './plugins/scrambler/',
    
    // 2m
    defaultAskInterval: 120000,
    
    game              : {
        answer        : '',
        scrambledWord : '',
        askInterval   : null,
        nick          : '',
        channel       : '',
        startTime     : '',
        inProgress    : false,
        timeElapsed   : '',
        score         : {}
    }
};

sc.init = function (client) {
    sc.client = client;
    sc.loadConfig(client.config);
    
    // Check for an answer
    client.ame.on('actionableMessage', function (info) {
        sc.checkAnswer(info);
    });
    
    // Listen for scrambler game control commands
    client.ame.on('actionableMessageAddressingBot', function (info) {
        if (info.command === 'sc' || info.command === 'scrambler') {
            var cmd = info.words[2];
            
            switch (cmd) {
                case 'start':
                    sc.startGame(info.channel);
                break;
                
                case 'stop':
                    sc.stopGame(info.channel);
                break;
                
                case 'score':
                    sc.displayScore(info.channel);
                break;
                
                case 'hint':
                    sc.displayHint(info.channel);
                break;
                
                // May need to revisit this later
                case 'skip':
                    sc.setGameData({ inProgress: false });
                    sc.ask(info.channel);
                break;
            }
        }
    });
};

sc.startGame = function (channel) {
    console.log('starting game');

    sc.ask(channel);
    
    sc.askInterval = setInterval(function () {
        
        sc.ask(channel);
        
    }, sc.cfg.askInterval || sc.defaultAskInterval);
};

sc.stopGame = function (channel) {
    clearInterval(sc.askInterval);
    
    sc.setGameData({
        answer       : '',
        scrambledWord: '',
        inProgress   : false
    });
    
    sc.client.say(channel, 'scrambler stopped!');
};

sc.displayHint = function (channel) {
    var msg = 'There was a problem looking up that word :[';

    define.getDefinitionAndProcessResult(sc.game.answer, function (result) {
        if (result !== false) {
            msg = 'Hint for \u0002' + sc.game.scrambledWord + '\u0002: ' + result;
        }
        
        sc.client.say(channel, msg);
    });
};

sc.displayScore = function (channel) {
    var scores = [];
    var msg    = '';
    
    _.each(sc.game.score, function (score, nick) {
        scores.push(nick + ': ' + score);
    });
    
    msg = scores.join(', ');
    
    sc.client.say(channel, msg);
};

sc.getPlayerScore = function (nick) {
    return typeof sc.game.score[nick] !== 'undefined' ? sc.game.score[nick] : 0;
};

sc.checkAnswer = function (info) {
    var isCorrect = sc.isCorrectAnswer(info.message);
    
    if (isCorrect) {
        console.log('CORRECT ANSWER: ' + sc.game.answer + ' === ' + info.message);
        
        // By default, say "in X seconds"
        var elapsed = moment().diff(sc.game.startTime, 'seconds', true);
        
        // But if it was more than a minute ago, let's display
        // the elapsed time differently
        if (elapsed > 60) {
            elapsed = sc.game.startTime.fromNow(true);
        } else {
            elapsed = elapsed + ' seconds';
        }
        
        console.log('elapsed: ', elapsed);
        
        sc.setGameData({
            nick       : info.nick,
            inProgress : false,
            timeElapsed: elapsed
        });
        
        sc.incrementScore(info.nick);
        
        // winner winner chicken dinner
        var msg = sc.getCorrectAnswerTemplate();
        sc.client.say(info.channel, msg);
        
        // start again
        sc.ask(info.channel);
        
    } else {
        //console.log('WRONG ANSWER: ' + sc.game.answer + ' != ' + info.message);
    }
};

sc.incrementScore = function (nick) {
    if (typeof sc.game.score[nick] !== 'undefined') {
        sc.game.score[nick]++;
    } else {
        sc.game.score[nick] = 1;
    }
    
    console.log('score updated: ', sc.game.score);
};

sc.ask = function (channel) {
    if (sc.game.inProgress) {
        return false;
    }
    
    var answer    = sc.getWord();
    var scrambled = sc.getScrambledWord(answer);  
    
    sc.setGameData({
        answer       : answer,
        scrambledWord: scrambled,
        inProgress   : true,
        startTime    : moment()
    });
    
    console.log(sc.game);
    
    var msg       = sc.getCompiledTemplate(sc.cfg.askTemplate, sc.game);
    
    sc.client.say(channel, msg);
};

sc.getCorrectAnswerTemplate = function () {
    return sc.getCompiledTemplate(sc.cfg.correctAnswerTemplate, sc.game);
};

sc.getCompiledTemplate  = function (compileMe, data) {
    var titleTemplate   = hbs.compile(compileMe);
    var tpl             = titleTemplate(data);
    
    return tpl;
};

sc.loadConfig = function (cfg) {
    sc.cfg   = cfg.plugins.scrambler;    
    sc.words = sc.getWords();
};

sc.setGameData = function (data) {
    sc.game = _.extend(sc.game, data);
};

sc.getWord = function () {
    return sc.words[Math.floor(Math.random() * sc.words.length)].toUpperCase();
};

sc.isCorrectAnswer = function (input) {
    return sc.game.answer.toLowerCase() === input.trim().toLowerCase();
};

/**
 * get word list
 *
 */
sc.getWords = function (fixture) {
    var file = sc.cfg.wordsFile;
    var path = sc.pluginPath + file;
    
    // Don't read in words again if we already have some
    if (sc.words.length > 0) {
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


// NYI
sc.getHint = function (word, counter) {
    var firstLetter = word.substring(0, 1);
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