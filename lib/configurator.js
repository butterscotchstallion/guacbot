/**
 * Configurator - handles operations concerning the bot config. Fetches configuration 
 * from database.
 *
 */
"use strict";
var when          = require('when');
var handlebars    = require('handlebars');
var db            = require('./db');
var pluginManager = require('./pluginManager');
var moment        = require('moment');
var irc           = require('irc');
var fs            = require('fs');
var _             = require('underscore');
var configurator  = {
    callbacks: [],
    config   : {
        plugins: {}
    },
    configFilename: './bot-config.json'
};

configurator.init = function () {
    try {        
        var config          = JSON.parse(fs.readFileSync(configurator.configFilename, 'utf8')).db;
        configurator.config = config;
        
        db.init(config, configurator.onDBLoaded);
        
    } catch (e) {
        console.log(e.stack);
    }
};

configurator.onDBLoaded = function (config) {
    console.log('Connected to "' + config.database + '"');
    
    configurator.loadConfig();
};

configurator.reload = function (options) {
    /**
     * loadPlugins requires client to be present, but since this 
     * method should only run after the bot has started, getting
     * the client again is unnecessary
     *
     */
    configurator.client = options.client;

    pluginManager.getEnabledPlugins()
                 .then(configurator.onPluginsLoaded)
                 .then(configurator.getPluginMessages)
                 .then(configurator.onPluginMessagesLoaded)
                 .then(pluginManager.reloadPlugins)
                 .then(function (reloaded) {
                    var def = when.defer();
                    
                    configurator.onPluginsReloaded(options, reloaded);
                    
                    // This will be passed to initializePlugins
                    def.resolve({
                        client : configurator.client,
                        plugins: configurator.config.plugins,
                        ame    : pluginManager.ame,
                        argus  : pluginManager.argus,
                        config : configurator.config
                    });
                    
                    return def.promise;
                 })
                 .then(pluginManager.initializePlugins)
                 .then(function (loaded) {
                    options.onPluginsLoaded(options.channel, loaded);
                 })
                 .catch(function (e) {
                    console.log(e.stack);
                    options.onErrorReloading(options.channel, e);
                 });
};

configurator.onPluginsReloaded = function (options, reloaded) {
    var def = when.defer();
    
    options.onPluginsReloaded(options.channel, reloaded);
    
    def.resolve(options);
    
    return def.promise;
};

configurator.loadConfig = function () {
    configurator.getConfig()
                .then(configurator.setConfig)
                .then(configurator.getChannels)
                .then(configurator.setChannels)   
                .then(configurator.getPluginChannels)
                .then(configurator.setPluginChannels)
                .then(configurator.getClient)
                .then(pluginManager.getEnabledPlugins)
                .then(configurator.onPluginsLoaded)
                .then(configurator.getPluginMessages)
                .then(configurator.onPluginMessagesLoaded)
                .then(pluginManager.loadPlugins)
                .then(configurator.connect)
                .catch(function (err) {
                    var stack = err.stack;
                    console.log(stack);
                    
                    process.exit();
                })
                .done(function () {
                    
                });
};

configurator.connect = function () {
    configurator.client.connect();
};

configurator.getClient = function () {
    var def      = when.defer();
    var channels = configurator.getChannelList();

    // Connect using config settings
    var client = new irc.Client(configurator.config.server, configurator.config.nick, {
        channels    : channels,
        showErrors  : true,
        userName    : configurator.config.username || 'guacbot',
        realName    : configurator.config.realname || 'guacbot',
        stripColors : true,
        autoConnect : false,
        sasl        : true,
        secure      : true,
        port        : 6697,
        messageSplit: 512
        //floodProtection: true,
        //floodProtectionDelay: 1000,
        //debug: true
    });
    
    configurator.client = client;
    
    // Track current nick
    client.currentNick = configurator.config.nick;
    
    // Pass along config
    client.config      = configurator.config;

    // Log server connection
    client.addListener('registered', function (message) {
        client.connectTime = new Date().getTime();
        console.log('Connected to ' + message.server);
        
        // "Welcome" message from ircd
        console.log(message.args[message.args.length-1]);
        
        // Identify with nickserv once connected
        configurator.identify();
    });
    
    // Reply to VERSION
    // XXX move to DB/plugin?
    client.addListener('ctcp-version', function (from, to) {
        client.notice(from, 'https://github.com/prgmrbill/guacbot');
    });
    
    client.addListener('error', function (message) {
        console.log("Unspecified error event: ", message);
    });
    
    configurator.client = client;
    
    def.resolve(client, configurator.config.plugins);
    
    return def.promise;
};

configurator.setConfig = function (config) {
    var def             = when.defer();    
    configurator.config = config;
    
    def.resolve();
    
    return def.promise;
};

configurator.setChannels = function (channels) {
    var def = when.defer();
    
    if (channels) {
        configurator.config.channels = channels;
        
        def.resolve();
        
    } else {
        def.reject('No channels found!');
    }
    
    return def.promise;
};

configurator.onConfigLoaded = function (plugins) {
    var def = when.defer();
    
    def.resolve(configurator.config);
    
    return def.promise;
};

configurator.onPluginMessagesLoaded = function (messages) {
    var def = when.defer();

    if (messages) {
        var name, msgName, msg;
        
        for (var j = 0; j < messages.length; j++) {
            name    = messages[j].pluginName;
            msgName = messages[j].name;
            msg     = messages[j].message;
            
            if (typeof configurator.config.plugins[name] === 'undefined') {
                configurator.config.plugins[name] = {};
            }
            
            if (typeof configurator.config.plugins[name].messages === 'undefined') {
                configurator.config.plugins[name].messages = {};
            }
            
            if (typeof configurator.config.plugins[name].messages[msgName] === 'undefined') {
                configurator.config.plugins[name].messages[msgName] = [];
            }
            
            configurator.config.plugins[name].messages[msgName].push(msg);
        }
        
        def.resolve({
            client      : configurator.client,
            plugins     : configurator.config.plugins,
            config      : configurator.config,
            configurator: configurator,
            argus       : pluginManager.argus
            // Don't add ame here: it's added elsewhere
        });
        
    } else {
        def.reject('No messages.');
    }
    
    return def.promise;
};

configurator.onPluginsLoaded = function (plugins) {
    var currentPlugin, name;
    var def      = when.defer();
    var channels = [];
    
    if (plugins && plugins.length > 0) {
        for (var j = 0; j < plugins.length; j++) {
            currentPlugin = plugins[j];
            name          = currentPlugin.filename;
            
            if (typeof configurator.config.plugins !== 'object') {
                configurator.config.plugins = {};
            }
            
            // Add channels
            channels = configurator.getPluginChannelsFromConfig(currentPlugin.id);
            
            currentPlugin.channels = channels;
            
            configurator.config.plugins[name] = currentPlugin;
        }
        
        if (configurator.config.plugins && _.keys(configurator.config.plugins).length > 0) {
            def.resolve(configurator.client, configurator.config.plugins);   
        } else {
            def.reject('No plugins loaded');
        }
    }
    
    return def.promise;
};

configurator.getPluginMessages = function () {
    var def   = when.defer();
    var cols  = ['pm.message', 
                 'pm.name',
                 'pm.plugin_id AS pluginID', 
                 'p.filename AS pluginName', 
                 'p.filename'];
                 
    var query = [
        'SELECT ',
        cols.join(','),
        'FROM plugin_messages pm',
        'JOIN plugins p ON p.id = pm.plugin_id',
        'WHERE 1=1',
        'AND p.enabled = 1'
    ].join("\n");
    
    db.connection.query(query, function (err, result) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

configurator.getChannels = function (config) {
    var cols  = ['name', 'logging_enabled AS loggingEnabled'];
    var def   = when.defer();
    var query = [
        'SELECT ',
        cols.join(','),
        'FROM channels c',
        'WHERE 1=1',
        'AND c.enabled = 1'
    ].join("\n");
    
    var qry = db.connection.query(query, function (err, result) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

configurator.getChannelList = function () {
    return _.pluck(configurator.config.channels, 'name');
};

/**
 * Sets up a map so we can reference it when we're building
 * the plugin config array
 *
 */
configurator.setPluginChannels = function (channels) {
    if (channels) {
        var cur;
        
        _.each(channels, function (k, j) {
            cur = channels[j];
            
            if (typeof configurator.config.plugins === 'undefined') {
                configurator.config.plugins = {};
            }
            
            if (typeof configurator.config.plugins[cur.pluginName] === 'undefined') {
                configurator.config.plugins[cur.pluginName] = { channels: [] };
            }
            
            if (typeof configurator.config.plugins[cur.pluginName].channels === 'undefined') {
                configurator.config.plugins[cur.pluginName].channels = [];
            }
            
            configurator.config.plugins[cur.pluginName].channels.push(cur.name);
        });
    }
};

configurator.getPluginChannelsFromConfig = function (pluginID) {
    var channels = [];
    
    var plugin   = _.find(configurator.config.plugins, function (p) {
        return p.id === pluginID;
    });
    
    if (plugin) {
        if (typeof plugin.channels !== 'undefined') {
            channels = plugin.channels;
        }
    }
    
    return channels;
};

configurator.getPluginChannels = function () {
    var cols  = ['c.name', 'p.filename AS pluginName'];
    var def   = when.defer();
    var query = [
        'SELECT ',
        cols.join(','),
        'FROM plugin_channels c',
        'JOIN plugins p ON p.id = c.plugin_id',
        'WHERE 1=1',
        'AND c.enabled = 1'
    ].join("\n");
    
    var qry = db.connection.query(query, function (err, result) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

configurator.getConfig = function (callback) {
    var cols  = ['username', 
                 'realname', 
                 'server', 
                 'nick', 
                 'nickserv_pw AS nickservPassword'];
    var def   = when.defer();
    var query = [
        'SELECT ',
        cols.join(','),
        'FROM config c'
    ].join("\n");
    
    db.connection.query(query, function (err, result) {
        if (err && result) {
            def.reject(err);
        } else {
            def.resolve(result[0]);
        }
    });
    
    return def.promise;
};

configurator.getPluginProperty = function (options) {
    return;
};

configurator.getMessage = function (options) {
    var messages = configurator.plugins[options.name].messages;
    
    return messages[~~(Math.random() * messages.length)];
};

configurator.identify = function () {
    var pw = configurator.config.nickservPassword;
    
    if (pw.length > 0) {
        configurator.client.say('nickserv', 'identify ' + pw);
    }
};

module.exports = configurator;