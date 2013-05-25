/**
 * tests for seen plugin
 *
 */
"use strict";

var cradle = require('cradle');
var assert = require("assert");

describe('seen should save', function () {
    var c  = new(cradle.Connection);
    var db = c.database('seen');
    
    it('should create the db', function () {
        db.exists(function (err, exists) {
            if (!exists) {
                db.create();
            }
            
            assert.equal(exists, true);
            assert.equal(err, null);
        });
    });
    
    it('should create a seen document', function () {
        db.save({
            name: 'PrgmrBill',
            lastSeen: '2013-04-23 12:18:06'
        }, function (err, res) {
            //console.log('res: ', res);         
            //console.log('err: ', err);
            assert.equal(err, null);
        });
    });
    
    it('should find the last seen time of an inserted user', function () {
        
        /*
        db.save({
            name: 'IcebergSlim',
            lastSeen: '2013-05-11 10:18:09'
        }, function (err, res) {
            console.log('res: ', res);         
            console.log('err: ', err);
            
            db.remove('IcebergSlim', res.rev, function (err, res) {                
                console.log('res: ', res);         
                console.log('err: ', err);
            });
            
        });
        */
        
        db.view('seen/all', { key: 'IcebergSlim' }, function (err, doc) {
            console.log('viewing');
            console.log(err); 
            console.log('doc:',doc);
            assert.equal(err, null);
        });
    });
    
});


