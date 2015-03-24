'use strict';

angular.module('trendngApp')
  .controller('GameCtrl', function ($scope, $http, socket, c3Factory) {
    $scope.awesomeThings = [];
    $scope.trends = [];
    var trendupdates = [];

    var maxUpdates = 10;
    var curUpdates = 0;

    //var addUpdatesList = function(trend) {
    //  trend.updates = [];
    //  for (var i=0; i < maxUpdates; i++) {
    //    trend.updates.push(0);
    //  }
    //}

    $scope.config = {
      data: {
        x: 'x',
        columns: []
      },
      axis: {
        x: {
          type: 'timeseries',
          tick: {
            format: '%H:%I:%S',
            fit: true
          }
        }
      },
      grid: {
        x: {
          show: true
        },
        y: {
          show: true
        }
      }
    };

    var trends = {x:[]};

    $http.get('/api/trends').success(function(trends) {
      $scope.trends = trends;
      socket.syncUpdates('trend', $scope.trends);
      socket.socket.on('trendupdate', function(updates) {
        var ts;
        for (var hashtag in updates) {
          ts = updates[hashtag].date;
          if (!trendupdates[hashtag]) {
            trendupdates[hashtag] = [updates[hashtag].value];
          } else {
            trendupdates[hashtag].push(updates[hashtag].value);
          }
          if (trendupdates[hashtag].length >= maxUpdates) {
            trendupdates[hashtag].shift();
          }
        }
        if (!trendupdates["x"]) {
          trendupdates["x"] = [Date.parse(ts)];
        } else {
          trendupdates['x'].push(Date.parse(ts));
        }
        if (trendupdates['x'].length >= maxUpdates) {
          trendupdates['x'].shift();
        }
        console.log(trendupdates);

        c3Factory.get('chart').then(function(chart) {
          chart.load({
            columns: transformColumns()
          });
        });
      });
    });

    var transformColumns = function() {
      var out = [];
      for (var key in trendupdates) {
        out.push([key].concat(trendupdates[key]));
      }
      console.log(out);
      return out;
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('trend');
      curUpdates = 0;
    });
  });
