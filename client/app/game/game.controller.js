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
        text: "wait, waiiiiit",
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
      },
      won: {
        text: "YAY, YOU'VE WON {0}$",
        color: "text-success"
      },
      lost: {
        text: "sorry, the bet is lost",
        color: "text-danger"
      }
    };
    var trendupdates = [];

    var maxUpdates = 10;
    var curUpdates = 0;
    var timeout = 5; // how many seconds before the end does the lock kick in
    var timerMax = 30;
    var timerText = "00:30";
    var timer;

    $scope.account = 100;

    $scope.progressbarType = "primary";

    $scope.timer = Timer.data;
    $scope.timer.max = timerMax;

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

    var nothingGoes = function() {
      for ( var i = 0; i < 5; i++ ){
        $scope.betDisabled[i] = true;
        if (!$scope.betPlaced[i]) {
          $scope.betTexts[i] = betTexts.timeout.text;
          $scope.betTextsColor[i] = betTexts.timeout.color;
        }
      }
      $scope.progressbarType = "danger";
    };

    var resetBetTexts = function() {
      for ( var i = 0; i < 5; i++ ){
        if (!$scope.betPlaced[i]) {
          $scope.betTexts[i] = betTexts.idle.text;
          $scope.betTextsColor[i] = betTexts.idle.color;
        }
        $scope.betDisabled[i] = false;
        $scope.betPlaced[i] = false;
        $scope.betMoney[i] = 0;
        $scope.betTrend[i] = null;
      }
      $scope.progressbarType = "primary";
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
        payout();
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
      $scope.timer.val -= 1;
      var text = $scope.timer.val + "";
      if (text.length == 1) {
        text = "0"+text;
      }
      $scope.timer.time = "00:"+text;
      if ($scope.timer.val == timeout) {
        nothingGoes();
      }
      $scope.$apply();
    };

    var countdownReset = function() {
      $scope.timer.val = timerMax;
      $scope.timer.time = timerText;
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

    var payout = function() {
      for (var i =0; i < 5; i++) {
        if ($scope.betPlaced[i]) {
          var hashtag = $scope.currentHashtags[i];
          var oldVal = trendupdates[hashtag][trendupdates[hashtag].length-2];
          var newVal = trendupdates[hashtag][trendupdates[hashtag].length-1];
          var winUp = ($scope.betTrend[i] == "UP" && oldVal < newVal);
          var winDown = ($scope.betTrend[i] == "DOWN" && oldVal > newVal);

          if (winUp || winDown) {
            $scope.betTexts[i] = betTexts.won.text.format($scope.betMoney[i]);
            $scope.betTextsColor[i] = betTexts.won.color + " flash";
            $scope.account += $scope.betMoney[i];
          } else {
            $scope.betTexts[i] = betTexts.lost.text.format($scope.betMoney[i]);
            $scope.betTextsColor[i] = betTexts.lost.color;
            $scope.account -= $scope.betMoney[i];
          }
        }
      }
    };

    $scope.placebet = function(i) {
      if (betIsValid(i)){
        $scope.betDisabled[i] = true;
        $scope.betTexts[i] = betTexts.betplaced.text.format($scope.betMoney[i], $scope.betTrend[i]);
        $scope.betTextsColor[i] = betTexts.betplaced.color;
        $scope.betPlaced[i] = true;
      } else {
        //$scope.betPlaced[i] = 0;
      }

    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('trend');
      curUpdates = 0;
    });
  });
