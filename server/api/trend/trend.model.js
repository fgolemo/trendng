'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TrendSchema = new Schema({
  name: String,
  info: String,
  active: { type: Boolean, default: true }/*,
  updates: [{ type: Number, ref: 'Trendupdate' }]*/
});

module.exports = mongoose.model('Trend', TrendSchema);
