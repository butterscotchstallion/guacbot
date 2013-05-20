/**
 * invite - automatically join when invited
 *
 */
"use strict";

var invite = {};

invite.init = function (client) {
    client.addListener('invite', function (channel, from, message) {
        client.join(channel);
    });
};

module.exports = invite;