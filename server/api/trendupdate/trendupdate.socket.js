/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Trendupdate = require('./trendupdate.model');

exports.register = function(socket) {
  Trendupdate.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Trendupdate.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('trendupdate:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('trendupdate:remove', doc);
}