'use strict';

var _ = require('lodash');
var Trendupdate = require('./trendupdate.model');

// Get list of trendupdates
exports.index = function(req, res) {
  Trendupdate.find(function (err, trendupdates) {
    if(err) { return handleError(res, err); }
    return res.json(200, trendupdates);
  });
};

// Get a single trendupdate
exports.show = function(req, res) {
  Trendupdate.findById(req.params.id, function (err, trendupdate) {
    if(err) { return handleError(res, err); }
    if(!trendupdate) { return res.send(404); }
    return res.json(trendupdate);
  });
};

// Creates a new trendupdate in the DB.
exports.create = function(req, res) {
  Trendupdate.create(req.body, function(err, trendupdate) {
    if(err) { return handleError(res, err); }
    return res.json(201, trendupdate);
  });
};

// Updates an existing trendupdate in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Trendupdate.findById(req.params.id, function (err, trendupdate) {
    if (err) { return handleError(res, err); }
    if(!trendupdate) { return res.send(404); }
    var updated = _.merge(trendupdate, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, trendupdate);
    });
  });
};

// Deletes a trendupdate from the DB.
exports.destroy = function(req, res) {
  Trendupdate.findById(req.params.id, function (err, trendupdate) {
    if(err) { return handleError(res, err); }
    if(!trendupdate) { return res.send(404); }
    trendupdate.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}