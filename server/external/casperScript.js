var casper = require('casper').create();

var top100 = {};

var getUserInfo = function (req, res) {
  var hashTag = req.body.twitterHandle
  var url = 'http://topsy.com/s?q=%23' + hashTag + "&window=h";
  casper.start(url);

  casper.waitFor(function check() {
    return this.getCurrentUrl() === url
  }, function then() {
    this.echo('current URL: ' + this.getCurrentUrl());

    var response = this.evaluate(function () {
      var items = [];
      var retweets = document.querySelector('.total-number').innerText;
      console.log(retweets, "I AM THE RETWEET MASTER -===============-")

      // var followers = document.querySelectorAll('.num-followers .num');
      // for (var i = 0; i < 100; i++) {
      //   items.push({
      //     name: names[i].innerText,
      //     screen_name: unames[i] ? unames[i].innerText.replace('@', '') : "undefined",
      //     followers_count: followers[i] ? followers[i].innerText.replace(/\,/g, '') : "undefined"
      //   });
      // }
      return retweets;
    });
    // top100 = { date_scraped: new Date(), data: response };
    // console.log(JSON.stringify(top100, null, '\t'));
    // var dateString = (new Date()).toISOString().replace(/\:/g, '-');
    // fs.write(dateString + 'top100.json', JSON.stringify(top100, null, '\t'), 'w');
    
  });
  casper.run();
}

// getTop100();



xgetUserInfo: function(req, res) {
    var twitterHandle = req.body.twitterHandle;

      //response is JSON string of arrays. We will parse first result in it, create JSON from it, and send it back to client.
      client.get('users/lookup', {
          'screen_name': twitterHandle
      }, function(error, response) {

          var twitterUserData = {};

          if (error) {
              console.log("Error getting data from Twitter API");
              res.send(404, "Sorry, bad Twitter handle - try again");
          } else {
              console.log("Data successfully retrieved from Twitter API");
              console.log("response screen name", response[0].screen_name);
              var returnedUserData =response[0];
              twitterUserData["screen_name"] = returnedUserData["screen_name"];
              twitterUserData["name"] = returnedUserData["name"];
              twitterUserData["follower_count_at_query_time"] = returnedUserData["followers_count"];
              twitterUserData["price_at_purchase"] = parseInt(returnedUserData["followers_count"]) / 1000000;
              res.json(twitterUserData);
          }


      })