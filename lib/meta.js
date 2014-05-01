/**
 * Meta - handles operations involving meta information for the logs
 *
 *
 */
"use strict";

var db   = require('./db');
var when = require('when');
var meta = {};

meta.init = function () {
    var config = JSON.parse(fs.readFileSync('./bot-config.json', 'utf8')).db;
    
    db.connect(config, meta.onDBLoaded);
};

meta.onDBLoaded = function (cfg) {
    console.log('Connected to ' + cfg.database);
};

meta.getUnprocessedLogs = function () {
    var def  = when.promise();
    var cols = ['id', 'nick', 'channel', 'message', 'ts'];
    
    var query = [
        'SELECT ' + cols.join(','),
        'FROM logs l',
        'WHERE 1=1',
        'AND channel = "#dorkd"',
        'AND LENGTH (message) >= 3',
        'AND id NOT IN (SELECT log_id FROM logs_meta_words_processed)',
        'LIMIT 5'        
    ].join("\n");
    
    var qry = db.connection.query(query);
    
    qry.on('result', function (row) {
    
    })
    .on('error', function (e) {
        def.reject(e);
    })
    .on('end', function () {
        console.log('done!');
        
    });
    
    return def.promise;
};

meta.onRowProcessed = function (id) {
    var def = when.promise();
    
    var query = [
        
    ].join("\n");
};

module.exports = meta;









