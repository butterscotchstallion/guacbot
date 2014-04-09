/**
 * Github notification announcer - checks database periodically to see if there are any
 * new commits
 *
 */
"use strict";

var db        = require('../../lib/db');
var hmp       = require('../../lib/helpMessageParser');
var admin     = require('../../plugins/admin');
var moment    = require('moment');
var _         = require('underscore');
var announcer = {};

announcer.loadConfig = function (options) {
    announcer.wholeConfig     = options.config;
    announcer.config          = options.config.plugins.github;
    announcer.client          = options.client;
    
    // Note: if there are no channels, this plugin will never make the bot
    // say anything, although it will continue to function otherwise
    announcer.config.channels = announcer.config.channels || [];
    announcer.config.interval = announcer.config.interval || 60000;
};

announcer.reload = function (options) {
    announcer.loadConfig(options);
};

announcer.init = function (options) {
    announcer.loadConfig(options);
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        var user = {
            userInfo: {
                user: info.info.user,
                host: info.info.host
            }
        };
        
        if (admin.userIsAdmin(user)) {
            if (info.command === 'github') {
                // Only send to this channel
                announcer.getLatestUnreadNotification({
                    channels         : [info.channel],
                    currentChannel   : info.channel,
                    noResultsCallback: announcer.sendNoResultsMessage
                });
            }
        }
    });
    
    if (announcer.config.channels.length > 0) {
        setInterval(function () {
            announcer.getLatestUnreadNotification();            
        }, announcer.config.interval);
    }
};

announcer.getCommitURL = function (options) {
    g.shorten(options.url, options.callback);
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
    var payload       = JSON.parse(info.payload);       
    var commits       = payload.commits || [];
    var commit        = payload.head_commit;
    var message       = announcer.tidyCommitMessage(commit.message);
    var messageMaxLen = 200;
    var timeAgo       = moment(commit.timestamp).fromNow();
    var url           = commit.url;
    var author        = commit.author.username;
    var message       = hmp.getMessage({
        plugin : 'github',
        config : announcer.wholeConfig,
        message: 'ok',
        data   : {
            author         : author,
            numberOfCommits: commits.length,
            timeAgo        : timeAgo,
            url            : url,
            message        : message,
            commitsWord    : commits.length === 1 ? 'commit' : 'commits'
        }
    });
    
    return message;
};

announcer.sendNotification = function (n, channels) {
    if (typeof channels === 'undefined') {
        channels = announcer.config.channels;
    }
    
    _.each(channels, function (k, j) {
        if (typeof n === 'object' && n) {
            var msg = announcer.getAnnouncementTemplate(n);

            announcer.client.say(channels[j], msg);
        }
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

announcer.getLatestUnreadNotification = function (options) {
    var q  = ' SELECT id, payload, '
        q += ' number_of_commits AS numberOfCommits,';
        q += ' created_at AS createdAt';
        q += ' FROM github_push_notifications gh';
        q += ' WHERE 1=1';
        q += ' AND notification_sent = 0';
        q += ' ORDER BY created_at DESC';
        q += ' LIMIT 1';
    
    var channels = options && options.channels || [];
    
    db.connection.query(q, function (err, rows, fields, channels) {
        if (rows && rows.length > 0) {
            announcer.processNotification(err, rows, fields, channels);
        } else {
            if (options && typeof options.noResultsCallback === 'function') {
                options.noResultsCallback(options);
            }
        }
    });
};

announcer.sendNoResultsMessage = function (options) {
    var msg = hmp.getMessage({
        plugin : 'github',
        config : announcer.wholeConfig,
        message: 'noResults'
    });
    
    announcer.client.say(options.currentChannel, msg);
};

announcer.processNotification = function (err, rows, fields, channels) {
    if (err) {
        console.log('announcer.getNotification error: ' + err);
    } else {
        // If OK, mark notification read
        if (!err && rows && rows.length > 0) {
            var notification = rows[0];
            
            announcer.sendNotification(notification, channels);
            
            if (notification && notification.id) {
                announcer.markNotificationRead(notification.id, function (result, err) {
                    if (!err) {
                        //console.log('OK: marked ' + rows[0].id + ' read');
                    } else {
                        console.log('ERROR: failed to mark ' + notification.id + ' read');
                    }
                });
            }
        }
    }
};

module.exports = announcer;


