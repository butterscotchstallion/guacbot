/**
 * irc log parser - parses this format:
 *
 * 09/30/13 17:53 <@chillulum> did you see/agree w/ this?
 *
 */
"use strict";

var _      = require('underscore');
var moment = require('moment');
var parser = {};

parser.parseLine = function (input) {
    var line  = input.trim();
    var isLog = line.indexOf('<') !== -1 && line.indexOf('***') === -1;
    
    if (line.length > 0 && isLog) {
        var words     = line.split(' ');
            words     = _.compact(words);        
        var channel   = '#idiots-club';
        var timestamp = moment(words.slice(0, 2).join(' ')).format('YYYY-MM-DD HH:mm:00');
        
        // This accomodate scenarios like this: (space before nick)
        // 04/30/02 21:58 < lol2> TODAY I CAME UP WITH A GREAT ANTI-HOMOPHOBES SLOGAN
        var spaceNick = words[2] === '<';
        var tmpNick   = spaceNick ? words[3] : words[2];
        var nick      = tmpNick.replace(/[<>\@\+\-\&]/g, '').trim();
        var message   = spaceNick ? words.slice(4) : words.slice(3);
            message   = message.join(' ');
        
        // Validate
        var messageValid = message.length > 0;
        var nickValid    = nick.length    > 0;
        var lineValid    = messageValid && nickValid;
        
        if (lineValid) {
            return {
                channel          : channel,
                ts               : timestamp,
                message          : message,
                nick             : nick,
                ic_log_indicator : 1
            };
        }
    }
};

parser.getInsertQuery = function (info) {
    var e    = function (input) {
        return db.connection.escape(input);
    };
    
    var qry  = 'INSERT INTO ic_logs (';
        qry += Object.keys(info).join(',') + ') VALUES (';
        qry += [
            e(info.nick),
            e(info.message),
            e(info.ts),
            e(info.channel),
        ].join(',') + ");\n";
    
    return qry;
};

module.exports = parser;