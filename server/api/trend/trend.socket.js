/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Trend = require('./trend.model');

exports.register = function(socket) {
  Trend.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Trend.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('trend:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('trend:remove', doc);
}