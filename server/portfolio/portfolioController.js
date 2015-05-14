// Portfolio Controller handles functions for dashboard display, stock purchases, 
// and stock sales interacting with the portfolio db.
// MVP will have option to buy a stock once, but can sell stocks on multiple dates.

var Portfolio = require('./portfolioModel.js');
var Q = require('q');
var twitter = require("../external/twitter.js")

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

            var twitterHandleString = twitterHandleArray.join(",")

            twitter.getUserInfoHelper(twitterHandleString, function(followersCount){
              //followersCount = [51255152, 2141241]

              // This following block of code represents our pricing algorithm. The stock price
              // increases or decreases according to the growth of their follower count compared
              // to the benchmark, which we deem as .00066, or 6.6% or 1%, or 6.6 basis points.
              // If they grow at the faster pace than .00066 then their stock price increases,
              // if they grow slower, then their stock price decreases.
              // This benchmark has been chosen by calculating the average follower growth rate
              // from the top 100 twitter accounts.

              for(var i = 0; i < followersCount.length; i++){
                console.log("ADDING NEW FOLLOWER COUNT FOR ONE CELEBRITY: ", portfolio.stocks[i].screen_name);

                portfolio.stocks[i]["current_follower_count"] = followersCount[i];

                var currentNumFollowers = followersCount[i];
                console.log("currentNumFollowers", currentNumFollowers)
                var originalNumFollowers = portfolio.stocks[i].follower_count_at_purchase;
                console.log("originmalNumFollowers is: ", originalNumFollowers)

                var currentDate = new Date();
                var numDays = Math.abs(Date.parse(currentDate) - Date.parse(portfolio.stocks[i].date_of_purchase))/(1000*60*60*24);
                var millisecondsBetweenPurchase = Math.abs(Date.parse(currentDate) - Date.parse(portfolio.stocks[i].date_of_purchase));

                console.log("millisecondsBetweenPurchase: ", millisecondsBetweenPurchase);

                // numDays is annualized daily, if not a full day has passed, we use the milliseconds that have passed divided by the milliseconds per day
                // then we use this to annualize the stock's current growth rate to an assumed daily value.
                // in simple terms: if the stock grows by 2 users in 10 seconds, we will assume the stock will keep
                // growing 2 users every 10 seconds for the first day. Then compare that against the benchmark.
                if(numDays < 1){ numDays = millisecondsBetweenPurchase / (1000 * 60 * 60 * 24) };
                console.log("numDays or fraction of day: ", numDays)

                var growthRate = Math.pow(( Math.abs(currentNumFollowers-originalNumFollowers) / originalNumFollowers) + 1, 1/numDays) - 1;
                console.log("daily growth rate: ", growthRate)
                var growthRateVsExpected = (growthRate - .00066)/.00066;
                console.log("growthrateVsExpected is: ", growthRateVsExpected)

                portfolio.stocks[i]["current_price"] = (1+growthRateVsExpected) * (portfolio.stocks[i].follower_count_at_purchase/1000000);
                if(portfolio.stocks[i]["current_price"] < 0) {
                  portfolio.stocks[i]["current_price"] = 0;
                }
                console.log("CURRENT PRICE IS: " + portfolio.stocks[i].current_price);
              }

              res.json(portfolio);

            })
          } else {
            res.json(portfolio);
          }
        }
      })
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
      .then(function(portfolio){

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
                console.log('Error!');
              }
            });

            console.log("Portfolio being sent from portfolioController: ", portfolio)
            res.json(portfolio);
          } else {
            res.send("Overdraft! You cannot buy this stock!");
          }
        }
      })
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
            console.log('Error!');
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




