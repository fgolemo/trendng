'use strict';

var _ = require('lodash');
var Trend = require('./trend.model');

// Get list of trends
exports.index = function(req, res) {
  Trend.find(function (err, trends) {
    if(err) { return handleError(res, err); }
    return res.json(200, trends);
  });
};

// Get a single trend
exports.show = function(req, res) {
  Trend.findById(req.params.id, function (err, trend) {
    if(err) { return handleError(res, err); }
    if(!trend) { return res.send(404); }
    return res.json(trend);
  });
};

// Creates a new trend in the DB.
exports.create = function(req, res) {
  Trend.create(req.body, function(err, trend) {
    if(err) { return handleError(res, err); }
    return res.json(201, trend);
  });
};

// Updates an existing trend in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Trend.findById(req.params.id, function (err, trend) {
    if (err) { return handleError(res, err); }
    if(!trend) { return res.send(404); }
    var updated = _.merge(trend, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, trend);
    });
  });
};

// Deletes a trend from the DB.
exports.destroy = function(req, res) {
  Trend.findById(req.params.id, function (err, trend) {
    if(err) { return handleError(res, err); }
    if(!trend) { return res.send(404); }
    trend.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}