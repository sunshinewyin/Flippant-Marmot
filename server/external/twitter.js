var Twitter = require("twitter");
var fs = require("fs");
var bodyParser = require("body-parser");
var sentiment = require("./sentiment.js");
var async = require("async");

//API credentials for our app
var credentials = fs.readFileSync('./server/external/twitterAPIcredentials.txt', 'utf8').split(" ");

var client = new Twitter({
    consumer_key: credentials[0],
    consumer_secret: credentials[1],
    access_token_key: credentials[2],
    access_token_secret: credentials[3]
});

module.exports = {

    /**
     * This function returns Twitter data for a POST request. The data in the POST must be of the form {"twitterHandle": "barackobama"}
     * @param {Object} req - request data for this request
     * @param {Object} res - response data for this response
     */
  getUserInfo: function(req, res) {
      var hashTag = req.body.twitterHandle

      //response is JSON string of arrays. We will parse first result in it, create JSON from it, and send it back to client.
      client.get('search/tweets', {
          q: hashTag,
          result_type: 'recent',
          count: 100

      }, function(error, tweets, response) {
          var twitterUserData = {};

          if (error) {
              console.log("Error getting data from Twitter API");
              res.send(404, "Sorry, bad Twitter handle - try again");
          } else {
              console.log("Data successfully retrieved from Twitter API");
              console.log(tweets)

              twitterUserData['screen_name'] = hashTag;
              twitterUserData['name'] = hashTag;
              twitterUserData['follower_count_at_query_time'] = 50;
              twitterUserData['price_at_purchase'] = parseInt(50/1000000);

              twitterUserData.tweets = [];
              async.each(tweets.statuses, function(tweet, next){
               sentiment.getSentiment(tweet.text, function(val)
                {
                  tweet.sentiment = val;
                  console.log(tweet.text, val);
                  twitterUserData.tweets.push(tweet);
                  next();
                })
              },
               function(err) {

                res.json(twitterUserData);
               });




              // console.log("response screen name", response[0].screen_name);
              // var returnedUserData =response[0];
              // twitterUserData["screen_name"] = returnedUserData["screen_name"];
              // twitterUserData["name"] = returnedUserData["name"];
              // twitterUserData["follower_count_at_query_time"] = returnedUserData["followers_count"];
              // twitterUserData["price_at_purchase"] = parseInt(returnedUserData["followers_count"]) / 1000000;
              // res.json(twitterUserData);
          }


      })

  },


  /**
   * This function returns Twitter data for one or more Twitter handles in the form of a comma-separated string. 
   * Similar to getUserInfo, but for Strings, not HTTP requests.
   * @param {String} twitterHandles - the handles to look up (e.g. "barackobama, katyperry")
   * @param {Function} callback - function to execute on results of query
   */
  getUserInfoHelper: function(twitterHandles, callback){
    client.get('users/lookup', {
        'screen_name': twitterHandles
    }, function(error, response) {


        if (error) {
          console.log("Error getting data from Twitter API");
          res.send(404, "Sorry, bad Twitter handle - try again");
        } else {
          console.log("Data successfully retrieved from Twitter API");

          var followersCount = [];

          for(var i = 0; i < response.length; i++){
            followersCount.push(response[i].followers_count);

          }
          callback(followersCount);

        }
    })
  }

};
