'use strict';

angular.module('trendngApp')
  .controller('GameCtrl', function ($scope, $http, socket, c3Factory, Timer) {
    $scope.awesomeThings = [];
    $scope.trends = [];
    $scope.betDisabled = [false, false, false, false, false];
    $scope.betTrend = [null, null, null, null, null];
    $scope.betMoney = [0, 0, 0, 0, 0];
    $scope.betPlaced = [0, 0, 0, 0, 0];
    $scope.bets = [];
    $scope.betTexts = ["", "", "", "", ""];
    $scope.betTextsColor = ["text-muted", "text-muted", "text-muted", "text-muted", "text-muted"];
    var betTexts = {
      idle: {
        text:"place your bets",
        color: "text-muted"
      },
      timeout: {
        text: "nothing goes",
        color: "text-warning"
      },
      noamount: {
        text: "please input an amount to bet",
        color: "text-primary"
      },
      notrend: {
        text: "please click either UP or DOWN",
        color: "text-primary"
      },
      betplaced: {
        text: "you bet {0}$ the trend will go {1}",
        color: "text-info"
      }
    };
    var trendupdates = [];

    var maxUpdates = 10;
    var curUpdates = 0;

    var timer;

    $scope.account = 100;

    $scope.test = "test";

    $scope.timer = Timer.data;

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

    var resetBetTexts = function() {
      for ( var i = 0; i < 5; i++ ){
        if (!$scope.betPlaced[i]) {
          $scope.betTexts[i] = betTexts.idle.text;
          $scope.betTextsColor[i] = betTexts.idle.color;
        }
        $scope.betDisabled[i] = false;
      }
    };

    var trends = {x:[]};
    $scope.currentHashtags = [];
    $http.get('/api/trends').success(function(trends) {
      $scope.trends = trends;
      socket.syncUpdates('trend', $scope.trends);
      socket.socket.on('trendupdate', function(updates) {
        countdownReset();
        countdownStart();
        var ts;
        var hashtags = [];
        for (var hashtag in updates) {
          hashtags.push(hashtag);
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
        $scope.currentHashtags = hashtags;
        if (!trendupdates["x"]) {
          trendupdates["x"] = [Date.parse(ts)];
        } else {
          trendupdates['x'].push(Date.parse(ts));
        }
        if (trendupdates['x'].length >= maxUpdates) {
          trendupdates['x'].shift();
        }

        c3Factory.get('chart').then(function(chart) {
          chart.load({
            columns: transformColumns()
          });
        });
        resetBetTexts();
      });
    });

    var countdownStart = function() {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(function(){
        countdown();
        if ($scope.timer.val > 0) {
          countdownStart();
        }
      }, 1000);
    };

    var countdown = function() {
      $scope.test = "222";
      $scope.timer.val -= 1;
      var text = $scope.timer.val + "";
      if (text.length == 1) {
        text = "0"+text;
      }
      $scope.timer.time = "00:"+text;
      $scope.$apply();
    };

    var countdownReset = function() {
      $scope.timer.val = 60;
      $scope.timer.time = "01:00";
    };

    var transformColumns = function() {
      var out = [];
      for (var key in trendupdates) {
        out.push([key].concat(trendupdates[key]));
      }
      //console.log(out);
      return out;
    };

    var betIsValid = function(i) {
      if (!$scope.betTrend[i]) {
        $scope.betTexts[i] = betTexts.notrend.text;
        $scope.betTextsColor[i] = betTexts.notrend.color;
        return false;
      }
      if ($scope.betMoney[i] <= 0) {
        $scope.betTexts[i] = betTexts.noamount.text;
        $scope.betTextsColor[i] = betTexts.noamount.color;
        return false;
      }
      return true;
    };

    $scope.placebet = function(i) {
      if (betIsValid(i)){
        $scope.betDisabled[i] = true;
        $scope.betTexts[i] = betTexts.betplaced.text.format($scope.betMoney[i], $scope.betTrend[i]);
        $scope.betTextsColor[i] = betTexts.betplaced.color;
      } else {
        //$scope.betPlaced[i] = 0;
      }

    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('trend');
      curUpdates = 0;
    });
  });
