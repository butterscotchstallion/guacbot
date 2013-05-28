/**
 * tests for seen plugin
 *
 */
"use strict";

var fs     = require('fs');
var assert = require("assert");
var config = JSON.parse(fs.readFileSync('../bot-config.json', 'utf8'));
var mysql  = require('mysql');
var seen   = require('../../plugins/seen/');

describe('seen should add a user', function () {
    beforeEach(function () {
        seen.connect(config.db);
    });
    
    it('should add a user', function () {
        var expected = {
            nick: 'billulum',
            host: 'localhost',
            message: 'sup',
            channel: '#guacamole',
            last_seen: 'NOW()'
        };
        
        var q = seen.getAddQuery(expected);
        
        assert.deepEqual(q.params, expected);
        
        seen.add(expected, function (results) {
            assert.notEqual(results.insertId, 0);
        });
    });    
});

describe('seen should find a user', function () {
    beforeEach(function () {
        seen.connect(config.db);
    });
    
    it('should get a user', function () {
        var q             = seen.getSeenQuery('billulum');
        var expectedQuery = "SELECT nick,"+
                                    "host,"+
                                    "message,"+
                                    "last_seen AS lastSeen,"+
                                    "channel"+
                            " FROM seen"+
                            " WHERE 1=1"+
                            " AND nick = ?";
        
        var expectedParams = ['billulum'];
        
        assert.deepEqual(q.params, expectedParams);
        assert.equal(q.query, expectedQuery);
        
        seen.get('billulum', function (result) {
            assert.equal('billulum', result.nick);
            assert.equal('localhost', result.host);
            assert.equal('#guacamole', result.channel);
            assert.equal('sup', result.message);
        });
    });
    
    /*
    it('should be undefined', function () {
        seen.get('liltuna', function (info) {
            //console.log(info);
            assert.equal(typeof(info), 'undefined');
        });
    });
    */
});


