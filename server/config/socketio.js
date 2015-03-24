/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');
var Twit = require('twit');
var hashtags = ['#KCA', '#DitchYourDateIn5Words', '#FOLLOW'];
var hashtagCounts = [0, 0, 0];
var Trend = require('../api/trend/trend.model');
var Trendupdate = require('../api/trendupdate/trendupdate.model');

var socketsToUpdate = [];

var streamUpdateFreq = 60000;
var trendUpdateFreq = 10000;

// When the user disconnects.. perform this
function onDisconnect(socket) {
  var i = socketsToUpdate.indexOf(socket);
  socketsToUpdate.slice(i, 1);
}

function twitUpdateTrends(T) {
  T.get('trends/place', {id: 1}, function(error, tweets, response){
    if(error) throw error;
    //console.log(tweets[0].trends);
    var out = [];
    for (var i in tweets[0].trends) {
      out.push(tweets[0].trends[i].name);
    }
    hashtags = out;
    var outCounts = [];
    for (var i= 0; i < out.length; i++) {
      outCounts.push(0);
    }
    hashtagCounts = outCounts;
  });
}

function twitGetStream(T) {
  var stream = T.stream('statuses/filter', { track: hashtags.join(','), language: 'en' });

  stream.on('tweet', function (tweet) {
    for (var i in hashtags) {
      for (var j in tweet.entities.hashtags) {
        if (tweet.entities.hashtags[j].text.toLowerCase() == hashtags[i].substring(1).toLowerCase()) {
          hashtagCounts[i] += 1;
        }
      }
    }
    //console.log(tweet.entities.hashtags);
  });

  setInterval(function(){
    var hashtagCountsBuffer = JSON.parse(JSON.stringify(hashtagCounts));
    console.log(hashtagCountsBuffer);
    for (var i in hashtagCounts) {
      hashtagCounts[i] = 0
    }
    var out = {};

    var date = new Date().toISOString();
    for (var i in hashtags) {
      out[hashtags[i]] = {
        value: hashtagCountsBuffer[i],
        date: date
      };
    }
    for (var i in socketsToUpdate) {
      socketsToUpdate[i].emit('trendupdate', out);
    }

  }, streamUpdateFreq);
}

function twitInit() {
  var T = new Twit({
    consumer_key: config.twitter.clientID,
    consumer_secret: config.twitter.clientSecret,
    access_token: config.twitter.accessToken,
    access_token_secret: config.twitter.accessTokenSecret
  });
  twitUpdateTrends(T);
  twitGetStream(T);
}

// When the user connects.. perform this
function onConnect(socket) {
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
  });

  // Insert sockets below
  require('../api/trendupdate/trendupdate.socket').register(socket);
  require('../api/trend/trend.socket').register(socket);
  require('../api/thing/thing.socket').register(socket);

  socketsToUpdate.push(socket);
}

module.exports = function (socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  twitInit();

  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
            socket.handshake.address.address + ':' + socket.handshake.address.port :
            process.env.DOMAIN;

    socket.connectedAt = new Date();

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
      console.info('[%s] DISCONNECTED', socket.address);
    });

    // Call onConnect.
    onConnect(socket);
    console.info('[%s] CONNECTED', socket.address);
  });
};
