/**
 * logger
 *
 */
"use strict";

var db     = require('../../lib/db');
var logger = {};

logger.init = function (options) {
    var client = options.client;
    
    // Log channel messages
    client.addListener('message#', function (nick, channel, text, message) {
        var info = {
            nick: nick,
            channel: channel,
            host: message.user + '@' + message.host,
            message: text
        };
        
        logger.log(info, function (result, err) {
            if (err) {
                console.log('logger error: ', err);
            } else {
                //console.log(result);
                //console.log(info);
            }
        });
    });
};

logger.log = function (info, callback) {
    var query = ' INSERT INTO logs SET ?, ts = NOW()';
    
    db.connection.query(query, info, function (err, result) {
        callback(result, err);
    });
};

logger.getRandomQuote = function (args) {
    var cols      = ['id', 'ts', 'message'];
    var searchQry = args.searchQuery ? args.searchQuery.trim() : false;
    var searchCls = searchQry        ? ' AND message LIKE ?'   : '';
    var params    = [args.message, args.nick, args.channel];
    
    if (searchCls) {
        params.push('%' + searchQry + '%');
    }
    
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';        
        // Don't show the message they just sent.
        // Fixes #11 - https://github.com/prgmrbill/guacbot/issues/11
        q   += ' AND message <> ?';
        q   += ' AND nick    =  ?';
        q   += ' AND channel =  ?';
        q   += searchCls;
        // Perhaps improve this in the future by selecting the ids and using JS
        // to select randomly from the set. finally, select a single quote using
        // id. This would significantly increase performance in larger data sets
        q   += ' ORDER BY RAND()';
        q   += ' LIMIT 1';
    
    db.connection.query(q, params, function (err, rows, fields) {
        if (err) {
            console.log('logger.getRandomQuote error: ' + err);
        } else {
            args.callback(rows[0], err);
        }
    });
};

logger.getMentions = function (args) {
    var cols  = ['id', 'nick', 'ts', 'channel', 'message'];
    
    /**
     * The limit is user input, so let's make sure it's valid
     * 1. Check that it is an integer
     * 2. Between 1 and 5
     *
     */
    var limit = /^[1-5]$/.test(args.limit) ? args.limit : 1;
    
    var validOrders = ['RAND()', 'ts'];
    var order       = 'ts';
    if (validOrders.indexOf(args.order) !== -1) {
        order = args.order;
    }
    
    var q     = ' SELECT ';
        q    += cols.join(',');
        q    += ' FROM logs';
        q    += ' WHERE 1=1';        
        q    += ' AND message LIKE ?';
        // Don't show the message they just sent.
        // Fixes #11 - https://github.com/prgmrbill/guacbot/issues/11
        q    += ' AND message <>   ?';
        
        // any channel if channel not specified
        if (args.channel) {
            q    += ' AND channel    = ?';
        }
        
        q    +  ' GROUP BY message, ts'
        q    += ' ORDER BY ' + order + ' DESC';
        // Can't bind parameters in a limit clause :[
        q    += ' LIMIT ' + limit;
    
    var params    = ['%' + args.searchQuery + '%',
                     args.message];
    
    if (args.channel) {
        params.push(args.channel);
    }
    
    //console.log('searching for ' + args.searchQuery + ' in channel ' + args.channel + ' limit ' + limit);
    //console.log('not equal to ' + args.message);
    
    // Perhaps implement a timeout here
    var qry  = db.connection.query(q, params);
    var rows = [];
    
    qry.on('result', function (row) {
        args.callback(row);
        rows.push(row);
    })
    .on('error', function (err) {
        console.log('logger.getMentions error: ' + err);
    })
    .on('end', function () {
        if (rows.length === 0 && typeof args.noResultsCB === 'function') {
            args.noResultsCB();
        }
    });
};

logger.getTopMentions = function (args) {
    var cols  = ['id', 
                 'nick', 
                 'channel', 
                 'COUNT(*) as wordcount'];
    
    var q     = ' SELECT ';
        q    += cols.join(',');
        q    += ' FROM logs';
        q    += ' WHERE 1=1';
        q    += ' AND message LIKE ?';
        q    += ' AND channel    = ?';
        q    += ' GROUP BY nick'
        q    += ' ORDER BY COUNT(*) DESC';
        q    += ' LIMIT ' + args.limit;
    
    var searchQuery = args.searchQuery;
    
    if (args.verbatim) {
        //Replace wildcards where the user wants them, i.e. replace " with %
        searchQuery = args.searchQuery.replace(/["']/g, "%");
        
    } else {
        searchQuery = '%' + args.searchQuery + '%';
        // Don't forget to remove the quotes!
        searchQuery = args.searchQuery.replace(/["']/g, "");
    }
    
    var params = [searchQuery, args.channel];
    var qry    = db.connection.query(q, params);
    var rows   = [];
    
    /**
     * The callback needs the entire result set at once
     * which is why we wait until the end to execute the
     * callback
     *
     */
    qry.on('result', function (row) {
        //args.callback(row);
        rows.push(row);
    })
    .on('error', function (err) {
        console.log('logger.getTopMentions error: ' + err);
    })
    .on('end', function () {
        if (rows.length === 0) {
            if (typeof args.noResultsCB === 'function') {
                args.noResultsCB();
            }
        } else {
            args.callback(rows);
        }
    });
    
    console.log('getTopMentions: ', qry.sql);
};

logger.getWordCountByNick = function (args) {
    var cols   = ['COUNT(*) as wordcount'];
    
    var q      = ' SELECT ';
        q     += cols.join(',');
        q     += ' FROM logs';
        q     += ' WHERE 1=1';        
        q     += ' AND channel    = ?';
        q     += ' AND nick       = ?';
        
    if (args.searchQuery.length > 0) {
        q     += ' AND message LIKE ?';
    }
    
    var params = [args.channel,
                  args.nick];
    
    if (args.searchQuery.length > 0) {
        params.push('%' + args.searchQuery + '%');
    }  
    
    var qry    = db.connection.query(q, params);
    var rows   = [];
    
    qry.on('result', function (row) {
        rows.push(row);
    })
    .on('error', function (err) {
        console.log('logger.getWordCountByNick error: ' + err);
    })
    .on('end', function () {
        if (rows.length > 0 && rows[0].wordcount > 0) {
            args.callback(rows[0]);
        } else {
            args.noResultsCB();
        }
    });
    
    console.log(qry.sql);
};

logger.getContext = function (info) {
    var limit = 3;
    var cols  = ['id', 'nick', 'ts', 'channel', 'message'];
    var query = [
        '(SELECT ' + cols + ' FROM logs ',
        'WHERE ID < ?',
        'AND channel = ?',
        'ORDER BY id DESC LIMIT ' + limit + ')',
        'UNION ALL',
        '(SELECT ' + cols + ' FROM logs ',
        'WHERE ID = ?',
        'AND channel = ?',
        'ORDER BY id DESC LIMIT ' + limit + ')',
        'UNION ALL',
        '(SELECT ' + cols + ' FROM logs ',
        'WHERE ID > ?',
        'AND channel = ?',
        'ORDER BY id ASC  LIMIT ' + limit + ')'
    ].join("\n");
    
    var params    = [info.id, 
                     info.channel, 
                     info.id, 
                     info.channel,
                     info.id,
                     info.channel];
    
    var parsedQry = db.connection.query(query, params, function (err, rows, fields) {
        if (err) {
            console.log('logger error: ' + err);
        } else {
            info.callback(rows, err);
        }
    });
};

logger.searchByMessage = function (nick, searchQuery, callback) {
    var cols = ['nick', 'host', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND nick <> ?';
        q   += ' AND message LIKE ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT 1';
    
    var params    = [nick, '%' + searchQuery + '%'];
    var parsedQry = db.connection.query(q, params, function (err, rows, fields) {
        if (err) {
            console.log('logger error: ' + err);
        } else {
            callback(rows[0], err);
        }
    });
};

logger.getFirstMention = function (args) {
    var cols = ['id', 'nick', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND channel    = ?';
        q   += ' AND message LIKE ?';
        // Don't show the message they just sent.
        // Fixes #11 - https://github.com/prgmrbill/guacbot/issues/11
        q   += ' AND message <>   ?';
        q   += ' ORDER BY ts';
        q   += ' LIMIT 1';
    
    var params = [args.channel, 
                  '%' + args.searchQuery + '%',
                  args.message];
    
    db.connection.query(q, params, function (err, rows, fields) {
        args.callback(rows[0], err);
    });
};

logger.getLastMention = function (args) {
    var cols = ['id', 'nick', 'message', 'ts', 'channel'];
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND message LIKE ?';
        q   += ' AND channel    = ?';
        // Don't show the message they just sent.
        // Fixes #11 - https://github.com/prgmrbill/guacbot/issues/11
        q   += ' AND message <>   ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT 1';
    
    var params = ['%' + args.searchQuery + '%', 
                  args.channel,
                  args.message];
    
    db.connection.query(q, params, function (err, rows, fields) {
        args.callback(rows[0], err);
    });
};

logger.getLastMessage = function (args) {
    var cols = ['id', 'nick', 'host', 'message', 'ts', 'channel'];
    
    /**
     * The limit is user input, so let's make sure it's valid
     * 1. Check that it is an integer
     * 2. Between 1 and 5
     *
     */
    var limit = /^[1-5]$/.test(args.limit) ? args.limit : 1;
    
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND nick    = ?';
        q   += ' AND channel = ?';
        // Don't show the message they just sent.
        // Fixes #11 - https://github.com/prgmrbill/guacbot/issues/11
        q   += ' AND message <>   ?';
        q   += ' ORDER BY ts DESC';
        q   += ' LIMIT ' + limit;
    
    var params = [args.nick, args.channel, args.message];
    
    db.connection.query(q, params, function (err, rows, fields) {
        args.callback(rows, err);
    });
};

logger.getFirstMessage = function (args) {
    var cols = ['id', 'nick', 'host', 'message', 'ts', 'channel'];
    
    var q    = ' SELECT ';
        q   += cols.join(',');
        q   += ' FROM logs';
        q   += ' WHERE 1=1';
        q   += ' AND nick    = ?';
        q   += ' AND channel = ?';
        q   += ' ORDER BY ts';
        q   += ' LIMIT 1';
    
    var params = [args.nick, args.channel, args.message];
    
    db.connection.query(q, params, function (err, rows, fields) {
        args.callback(rows[0], err);
    });
};

module.exports = logger;
