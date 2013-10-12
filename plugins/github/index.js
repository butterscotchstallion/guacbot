/**
 * Github notification announcer - checks database periodically to see if there are any
 * new commits
 *
 */
"use strict";

var db        = require('../../plugins/db');
var hbs       = require('handlebars');
var admin     = require('../../plugins/admin');
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
        
        //console.log(user);
        
        if (admin.userIsAdmin(user)) {
            if (info.words[1] === 'github') {
                console.log('fetching notifications');
                
                announcer.getLatestNotification(function (n) {
                    if (typeof n === 'object' && n) {
                        var msg = announcer.getAnnouncementTemplate(n);
                        
                        client.say(info.channel, msg);
                    } else {
                        client.say(info.channel, 'got nothin');
                    }
                });
            }
        } else {
            console.log('not admin');
        }
    });
    
    var channels = pluginCfg.channels || [];
    var interval = pluginCfg.interval || 60000;
    
    if (channels.length > 0) {
        setInterval(function () {
            announcer.getLatestNotification(function (n) {
                console.log('checking for notifications...');
                
                for (var j = 0; j < channels.length; j++) {
                    if (typeof n === 'object' && n) {
                        var msg = announcer.getAnnouncementTemplate(n);
                        
                        client.say(channels[j], msg);
                    } else {
                        console.log('no notifications!');
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
    var compileMe, tidyMessage, payload, commit;

    var singleCommitTpl   = '\u0002{{author}}\u0002 :: {{message}} :: {{commitURL}}';
    var multipleCommitTpl = '\u0002{{authors}}\u0002 pushed \u0002{{numberOfCommits}} commits\u0002 to {{repoURL}}';
    
    payload               = JSON.parse(info.payload);
    
    if (info.numberOfCommits === 1) {
        compileMe         = singleCommitTpl;
        commit            = payload.commits[0];
        tidyMessage       = announcer.tidyCommitMessage(commit.message);
        info.message      = tidyMessage;
        info.commitURL    = commit.url;
        info.author       = commit.committer.username;
    } else {
        compileMe         = multipleCommitTpl;        
        var commits       = payload.commits || [];
        var authors       = [];
        var author        = false;
        var csAuthor      = '';
        
        for (var j = 0; j < commits.length; j++) {
            author = commits[j].committer.username;
            
            if (author && authors.indexOf(author) === -1) {
                authors.push(author);
            }
        }
        
        csAuthor          = authors.join(', ');
        info.authors      = csAuthor;
        info.repoURL      = payload.repository.url;
    }
    
    var tpl               = hbs.compile(compileMe);
    
    return tpl(info);
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
                            console.log('OK: marked ' + rows[0].id + ' read');
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