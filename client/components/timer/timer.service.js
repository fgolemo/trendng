'use strict';

angular.module('trendngApp')
  .factory('Timer', function () {
    var max = 60;
    var time = '01:00';
    var val = 60;
    return {
      data: {
        max: max,
        time: time,
        val: val
      }
    };
  }
);
