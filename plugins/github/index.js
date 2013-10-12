/**
 * Github notification announcer - checks database periodically to see if there are any
 * new commits
 *
 */
"use strict";

var db        = require('../../plugins/db');
var hbs       = require('handlebars');
var admin     = require('../../plugins/admin');
var moment    = require('moment');
var announcer = {};

announcer.init = function (client) {
    var pluginCfg = client.config.plugins.github;
    
    client.ame.on('actionableMessageAddressingBot', function (info) {
        var user = {
            userInfo: {
                user: info.info.user,
                host: info.info.host
            }
        };
        
        if (admin.userIsAdmin(user)) {
            if (info.words[1] === 'github') {                
                announcer.getLatestNotification(function (n) {
                    if (typeof n === 'object' && n) {
                        var msg = announcer.getAnnouncementTemplate(n);
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'No unread notifications');
                    }
                });
            }
        }
    });
    
    var channels = pluginCfg.channels || [];
    var interval = pluginCfg.interval || 60000;
    
    if (channels.length > 0) {
        setInterval(function () {
            announcer.getLatestNotification(function (n) {
                for (var j = 0; j < channels.length; j++) {
                    if (typeof n === 'object' && n) {
                        var msg = announcer.getAnnouncementTemplate(n);
                        
                        client.say(channels[j], msg);
                    }
                }
            });
        }, interval);
    }
};

announcer.tidyCommitMessage = function (msg) {
    var tidy       = msg;
    var tidyMaxLen = 200;
    
    // Replace newlines with spaces
    tidy = tidy.replace(/\n/g, ' ');
    tidy = tidy.replace(/\r\n/g, ' ');
    
    if (tidy.length > tidyMaxLen) {
        tidy = tidy.substring(0, tidyMaxLen).trim() + '...';
    }
    
    return tidy;
};

announcer.getAnnouncementTemplate = function (info) {
    var compileMe     = '{{author}} pushed {{numberOfCommits}} {{commitsWord}} {{timeAgo}} :: {{message}} :: {{url}}';
    var payload       = JSON.parse(info.payload);       
    var commits       = payload.commits || [];
    var commit        = payload.head_commit;
    var message       = announcer.tidyCommitMessage(commit.message);
    var messageMaxLen = 200;
    var timeAgo       = moment(commit.timestamp).fromNow();
    var url           = commit.url;
    var author        = commit.author.username;    
    var tpl           = hbs.compile(compileMe);
    
    return tpl({
        author         : author,
        numberOfCommits: commits.length,
        timeAgo        : timeAgo,
        url            : url,
        message        : message,
        commitsWord    : commits.length === 1 ? 'commit' : 'commits'
    });
};

announcer.markNotificationRead = function (notificationID, callback) {
    var query  = ' UPDATE github_push_notifications';
        query += ' SET notification_sent = 1';
        query += ' WHERE id = ?';
    
    db.connection.query(query, [notificationID], function (err, result) {
        callback(result, err);
    });
};

announcer.getLatestNotification = function (callback) {
    var q  = ' SELECT id, payload, '
        q += ' number_of_commits AS numberOfCommits,';
        q += ' created_at AS createdAt';
        q += ' FROM github_push_notifications gh';
        q += ' WHERE 1=1';
        q += ' AND notification_sent = 0';
        q += ' ORDER BY created_at DESC';
        q += ' LIMIT 1';
    
    db.connection.query(q, function (err, rows, fields) {
        if (err) {
            console.log('announcer.getNotification error: ' + err);
        } else {
            // If OK, mark notification read
            if (!err) {
                callback(rows[0], err);
                
                if (typeof rows[0] !== 'undefined' && rows[0].id) {
                    announcer.markNotificationRead(rows[0].id, function (result, err) {
                        if (!err) {
                            //console.log('OK: marked ' + rows[0].id + ' read');
                        } else {
                            console.log('ERROR: failed to mark ' + rows[0].id + ' read');
                        }
                    });
                }
            }
        }
    });
};

module.exports = announcer;