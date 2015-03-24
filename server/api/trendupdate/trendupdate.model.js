'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TrendupdateSchema = new Schema({
  trend: { type: Schema.Types.ObjectId, ref: 'Trend' },

  ts: { type: Date, default: Date.now },
  tpm: Number
});

module.exports = mongoose.model('Trendupdate', TrendupdateSchema);
