/**
 * ircLogImporter - uses ircLogParser to parse irc logs and import them into a MySQL db
 *
 */
"use strict";

var importer = {};
var fs       = require('fs');
var db       = require('../plugins/db');
var config   = JSON.parse(fs.readFileSync('dorkd-config.json', 'utf8'));
var lr       = require('line-reader');
var parser   = require('../lib/ircLogParser');
var moment   = require('moment');

var cfg      = {
    log           : '../#idiots-club.log',
    table         : 'ic_logs',
    
    // This value lets me know that if we ever import
    // newer logs or a different dump, I can delete the ones
    // with this value
    icLogIndicator: 1,
    
    importStart   : moment(),
    rowCount      : 0
};

importer.init = function () {
    var callback = function () {
        db.connection.on('error', function(err) {
            console.log(err);
            process.exit();
        });
        
        importer.parseLogAndImport();
    };
    
    db.init({
        config: config
    }, callback);
};

importer.parseLogAndImport = function () {
    lr.eachLine(cfg.log, function (line, last) {
        console.log('processing: "', line, '"');
        
        importer.addMessage(line, function (err, result) {
            if (err) {
                console.log('ERROR: ', err);
                return false;
            } else {
                cfg.rowCount++;
                console.log('OK: ', line);
                console.log('Added row #' + cfg.rowCount);
            }
        });
        
        /*
        if (cfg.rowCount >= 5) {
            return false;
            process.exit();
        }
        */
        
    }).then(function () {
        console.log('Imported ' + cfg.rowCount + ' lines in ' + moment().fromNow(cfg.importStart));        
        process.exit();
    });
};

importer.writeSQL = function (line, callback) {
    var info = parser.parseLine(line);
    
    if (typeof info === 'object') {
        var qry = parser.getInsertQuery(info);
        
        console.log(qry);
    }
};

importer.addMessage = function (line, callback) {
    var info = parser.parseLine(line);
    var qry  = '';
    
    if (typeof info === 'object') {
        // Only query once per second
        setTimeout(function () {       
            console.log('inserting:', info);
            
            qry       = 'INSERT INTO ' + cfg.table + ' SET ?';
            
            var query = db.connection.query(qry, info, function (err, result) {
                if (err) {
                    console.log('DB error:', err);                
                    callback(true);
                } else {
                    console.log(query.sql);
                    callback(err, result);
                }
            });
            
        }, 5000);
        
    } else {
        console.log('ERROR parsing line: ', line);
        callback(true);
    }
};

importer.init();

