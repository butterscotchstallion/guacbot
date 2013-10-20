/**
 * ArgusEventEmitter - emits events when hostmasks are updated
 * so plugins can listen and handle functionality that depends on
 * having the hostmask of a user
 *
 */
"use strict";

var util = require('util');

function ArgusEventEmitter() {
    var self = this;
    
    self.emitHostmaskUpdateEvent = function (info) {
        self.emit('hostmaskUpdated', info);
    };
}

util.inherits(ArgusEventEmitter, process.EventEmitter);

module.exports = new ArgusEventEmitter();