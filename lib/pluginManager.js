/**
 * Handles plugin operations
 *
 */
var ame          = require('../lib/actionableMessageEmitter');
var argus        = require('../lib/argus');
var db           = require('../lib/db');
var when         = require('when');
var fs           = require('fs');
var _            = require('underscore');
var configurator = require('../lib/configurator');

var p            = {
    loadedPlugins    : [],
    loadedFilenames  : [],
    configurationPath: './bot-config.json',
    config           : {
        messages: {}
    }
};

p.reload = function (client, callback) {
    // get enabled plugins again
    // check for new ones and init if they're new
    // check each plugin and see if it has reload
    // then execute it if so
    // might need config?
    p.configurator.reload({
        client  : client,
        callback: callback
    });
};

p.loadPlugins = function (options) {
    var curPlugin;
    var pluginPath      = '';
    var pluginName      = '';
    var filename        = '';
    var def             = when.defer();
    var plugins         = options.plugins;
    var client          = options.client;
    p.configurator      = options.configurator;
    p.client            = client;
    p.config            = options.config;
    
    //console.log('client: ', client);
    //console.log('plugins: ', plugins);
    
    if (plugins) {
        // Load AME for main listener
        // when reloading, make sure this isn't called again
        // so we don't stack the listeners
        ame.init(client);
        
        argus.init(_.extend({
            ame: ame
        }, options));
        
        p.initializePlugins({
            ame    : ame,
            client : client,
            argus  : argus,
            plugins: plugins
        });
        
        console.log(_.keys(plugins).length   + ' plugins loaded.');
        
        def.resolve(plugins);
        
    } else {
        def.reject('Bad plugins passed to loadPlugins: ' + plugins);
    }
    
    return def.promise;
};

p.initializePlugins = function (options) {
    var plugins = options.plugins;

    _.each(plugins, function (k, j) {
        if (typeof plugins[j].filename === 'string') {
            filename   = plugins[j].filename;
            pluginPath = p.getPluginPath(filename);            
            pluginName = plugins[j].displayName;
            curPlugin  = require(pluginPath);
            
            console.log('Loading plugin:', pluginName);
            
            // Need to check if reloading. If so, change method
            // to loadConfig
            if (typeof curPlugin.init === 'function') {                
                if (p.loadedFilenames.indexOf(filename) === -1) {
                    curPlugin.init({
                        client       : p.client,
                        plugins      : options.plugins,
                        pluginManager: p,
                        ame          : options.ame,
                        argus        : options.argus,
                        config       : p.config
                    });
                    
                    p.loadedFilenames.push(pluginName);
                }
                
                if (p.loadedPlugins.indexOf(pluginName) === -1) {
                    p.loadedPlugins.push(pluginName);
                }
                
            } else {
                def.reject('Plugin missing init(): ', curPlugin);
            }
        }
    });
};

p.reloadPlugins = function (options) {
    var plugins  = options.plugins;
    var def      = when.defer();
    var reloaded = 0;
    
    _.each(plugins, function (k, j) {
        if (typeof plugins[j].filename === 'string') {
            filename   = plugins[j].filename;
            pluginPath = p.getPluginPath(filename);            
            pluginName = plugins[j].displayName;
            curPlugin  = require(pluginPath);
            
            if (typeof curPlugin.reload === 'function') {
                console.log('Reloading plugin:', pluginName);
                
                curPlugin.reload({
                    client       : p.client,
                    plugins      : options.plugins,
                    pluginManager: p,
                    ame          : options.ame,
                    argus        : options.argus,
                    config       : p.config
                });
                
                if (p.loadedFilenames.indexOf(filename) === -1) {
                    p.loadedFilenames.push(filename);
                }
                
                if (p.loadedPlugins.indexOf(pluginName) === -1) {
                    p.loadedPlugins.push(pluginName);                
                }
                
                reloaded++;
            }
        }
    });
    
    def.resolve(reloaded);
    
    return def.promise;
};

p.getPluginPath = function (filename) {
    return process.cwd() + '/plugins/' + filename + '/index.js';
};

p.getLoadedPlugins  = function () {
    return p.loadedPlugins;
};

p.getEnabledPlugins = function () {
    var def   = when.defer();        
    var cols  = ['p.name AS displayName', 
                 'p.filename'];
    
    var query = [
        'SELECT ' + cols.join(','),
        'FROM plugins p',
        'WHERE 1=1',
        'AND p.enabled = 1',
        'ORDER BY name'
    ].join("\n");
    
    db.connection.query(query, function (err, rows, fields) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(rows);
        }
    });
    
    return def.promise;
};

p.isValidChannel = function (config, channel) {
    var valid = true;
    
    if (typeof config.channels !== 'undefined' && config.channels.length > 0) {
        valid = config.channels.indexOf(channel) !== -1;
    }
    
    return valid;
};

module.exports = p;