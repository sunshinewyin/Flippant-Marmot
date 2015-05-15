// Portfolio Controller handles functions for dashboard display, stock purchases, 
// and stock sales interacting with the portfolio db.
// MVP will have option to buy a stock once, but can sell stocks on multiple dates.

var Portfolio = require('./portfolioModel.js');
var Q = require('q');
var twitter = require("../external/twitter.js");
var async = require("async");

module.exports = {
  displayAllStocks: function(req, res, next){
    console.log("display all stocks being called!");
    console.log("req.session.passport LOOKS LIKE: ", req.session.passport)

    if(!req.session.passport){
      console.log("You are not signed in!");
    } else {

    var userObj = req.session.passport.user;
    var create, newPortfolio;

    var findPortfolio = Q.nbind(Portfolio.findOne, Portfolio);
    findPortfolio({user_id: userObj._id})
      .then(function(portfolio){
        if(!portfolio){
          create = Q.nbind(Portfolio.create, Portfolio);
          newPortfolio = {
            user_id     : req.session.passport.user._id, // check passport authentication
            cash_balance: 10000,
            stocks: []
          }
          create(newPortfolio);

          // To fix: temporary attributes are not attaching to the portfolio being sent
          newPortfolio['user_twitter_handle'] = req.session.passport.user.screen_name;
          newPortfolio['name'] = req.session.passport.user.displayname;

          res.json(newPortfolio);

        } else {
          portfolio['user_twitter_handle'] = req.session.passport.user.screen_name;
          portfolio['name'] = req.session.passport.user.displayname;

          if(portfolio.stocks.length > 0){
            var twitterHandleArray = [];

            for(var i = 0; i < portfolio.stocks.length; i++){
              var twitterRequest = portfolio.stocks[i].screen_name.slice(1);
              twitterHandleArray.push(twitterRequest);
            }

            console.log("twitterHandleArray", twitterHandleArray);
            var resultTweets = [];
            async.each(twitterHandleArray, function(result, next)
            {
              twitter.getUserInfo({body: {twitterHandle: result}}, {json:function(data)
                {
                  resultTweets.push(data);
                  next();
                }})
            }, function(err)
            {
              if(err)
              {

              }
              else
              {
                for(var i = 0; i < resultTweets.length; i++){
                console.log("ADDING NEW FOLLOWER COUNT FOR ONE CELEBRITY: ", portfolio.stocks[i].screen_name);

                portfolio.stocks[i]["current_follower_count"] = resultTweets[i];

                var currentNumFollowers = resultTweets[i].tweets.length;
                console.log("currentNumFollowers", currentNumFollowers)
                var originalSentiment = portfolio.stocks[i].sentiment || 0;
                var sentimentDelta = resultTweets[i].sentiment - originalSentiment;

                portfolio.stocks[i]["current_price"] = currentNumFollowers * sentimentDelta;

                console.log("CURRENT PRICE IS: " + portfolio.stocks[i].current_price);
              }

              portfolio.save();

              res.json(portfolio);
              }
            });
        }
      }})
      .fail(function(error){
        console.log('error', error);
      });
    }
  },

  buy: function(req, res, next){

    var userObj = req.session.passport.user;

    var findPortfolio = Q.nbind(Portfolio.findOne, Portfolio);

    console.log("INSIDE BUY FUNCTION");

    findPortfolio({user_id: userObj._id})
      .then(function(portfolio) {

          var overDraft = false;

          if(portfolio.cash_balance < (req.body.shares * req.body.price_at_purchase)){
            overDraft = true;
            console.log("Overdraft alert! You cannot purchase this stock!");
          }

          // In this MVP version, users cannot buy multiple instances of the same stock.
          // Below is the code to stop purchases of stock they already own.
          var purchaseOfSameStock = false;
          for(var i = 0; i < portfolio.stocks.length; i++){
            if(portfolio.stocks[i].screen_name === req.body.screen_name){
              purchaseOfSameStock = true;
            }
          }

          if(purchaseOfSameStock){
            res.send("In this version, you cannot buy the same stock twice. Try again.");
          } else {
            if(!overDraft){
              portfolio.cash_balance = portfolio.cash_balance - (req.body.shares * req.body.price_at_purchase);
              portfolio.stocks.push(req.body);
              console.log("Add Stock", req.body.sentiment);

              // To fix: temporary attributes are not attaching to the portfolio being sent
              portfolio['user_twitter_handle'] = req.session.passport.user.screen_name;
              portfolio['name'] = req.session.passport.user.displayname;

              portfolio.save(function(err){
                if(err){
                  console.log('Error!', err);
                }
              });

              console.log("Portfolio being sent from portfolioController: ", portfolio)
              res.json(portfolio);
            } else {
              res.send("Overdraft! You cannot buy this stock!");
            }
          }
        }
      )
      .fail(function(error){
        console.log(error);
      });
  },
  sell: function(req, res, next){

    var userObj = req.session.passport.user;

    console.log('req.body: ', req.body);
    // req.body should pass in
    // at purchase:
    // {
    //     "screen_name": "@LadyGaga",
    //     "name": "Lady Gaga ga",
    //     "follower_count_at_purchase": 12000000,
    //     "price_at_purchase": 12,
    //     "date_of_purchase": "Tue May 05 2015 14:11:43 GMT-0700 (PDT)",
    //     "shares": 100
    // }
    //
    //     at sale:
    // {
    //     "screen_name": "@LadyGaga",
    //     "name": "Lady Gaga ga",
    //     "current_follower_count": 15000000, // front end user input
    //     "current_date": "Tue May 05 2015 14:11:43 GMT-0700 (PDT)",
    //     "current_price": 15,
    //     "shares": 100 // front user input
    // }

    var findPortfolio = Q.nbind(Portfolio.findOne, Portfolio);

    findPortfolio({user_id: userObj._id})
      .then(function(portfolio){
        if(req.body.shares && req.body.current_price)
          portfolio.cash_balance = portfolio.cash_balance + (req.body.shares * req.body.current_price);

        for(var i = portfolio.stocks.length - 1; i >= 0; i--){
          if(portfolio.stocks[i].screen_name === req.body.screen_name){
            if(portfolio.stocks[i].shares > req.body.shares){
              console.log("i:", i)
                portfolio.stocks[i].shares = portfolio.stocks[i].shares - req.body.shares;
            }
             else {
              portfolio.stocks.splice(i, 1);
            }
          }
        }

        console.log("portfolio.stocks[1].shares outside for loop: ", portfolio.stocks[1])
        console.log("new portfolio right before sale: ", portfolio);

        // To fix: temporary attributes are not attaching to the portfolio being sent
        portfolio['user_twitter_handle'] = req.session.passport.user.screen_name;
        portfolio['name'] = req.session.passport.user.displayname;

        portfolio.save(function(err){
          if(err){
            console.log('Error!', err);
          }
        res.json(portfolio);
        });

        console.log("new portfolio right after sale: ", portfolio);


      })
      .fail(function(error){
        console.log(error);
   });
  }
}




