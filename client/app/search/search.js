angular.module('socialStock.search', ['n3-line-chart'])


/** This is a controller to dictate search functions with the use of the helper functions in the clientFactory */
.controller('SearchController', function ($rootScope, $scope, $location, clientFactory) {

  $scope.portfolio;
  $scope.networth;





 // $scope.search = function(handle){

 //      $rootScope.line = {
 //          bucket: [0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 1],
 //          labels: ["-3", "-2", "-1", "0", "1", "2", "3"],
 //          data: [0,0,0,0,0,0,0 ]
 //        };
 //    clientFactory.getTwitterInfo(handle).then(function(data){



 //      $scope.stocks = [data.data];
 //      console.log($scope.stocks[0].tweets);

 //      var tweetsArray = $scope.stocks[0].tweets;
 //      var sentimentArray = tweetsArray.forEach(function(tweet){
 //        for(var i = 0; i< $rootScope.line.bucket.length; i++) {
 //          if((tweet.sentiment+1)/2 <$rootScope.line.bucket[i] ) {
 //            $rootScope.line.bucket[i]++;
 //            break;
 //          }
 //        }
 //      });
 //      var xArray = tweetsArray.map(function(tweet, index){
 //        return index;
 //      });




 //      $scope.searchTerm = '';
 //    });
 //  };
  /** search function to get follower data and current price of stock
  * @param {string} handle - The twitter handle searching
  */


  $rootScope.line = {
          bucket: [0.14, 0.28, 0.42, 0.56, 0.70, 0.84, 1],
          labels: ["-3", "-2", "-1", "0", "1", "2", "3"],
          data: [[0,0,0,0,0,0,0 ], [0,0,0,0,0,0,0 ]]
    }
  $scope.search = function(handle){
    clientFactory.getTwitterInfo(handle).then(function(data){

      $scope.stocks = [data.data];
      console.log($scope.stocks[0].tweets);

  $rootScope.line.data[0] = [0,0,0,0,0,0,0 ];
    $rootScope.line.data[1] = [0,0,0,0,0,0,0 ];


      var tweetsArray = $scope.stocks[0].tweets;
      var totalRetweets = 0;
      tweetsArray.forEach(function(tweet){
        totalRetweets += tweet.retweet_count;
      });

      var sentimentArray = tweetsArray.forEach(function(tweet){
        for(var i = 0; i< $rootScope.line.bucket.length; i++) {
          if((tweet.sentiment+1)/2 <$rootScope.line.bucket[i] ) {
            $rootScope.line.data[0][i]++;
             $rootScope.line.data[1][i] += tweet.retweet_count;
            break;
          }
        }
      });

       for(var i = 0; i< 7; i++) {
          $rootScope.line.data[1][i] =  $rootScope.line.data[1][i]/ $rootScope.line.data[0][i];
      }
      var finalResults = [];
      for(var i = 0; i< 7; i++) {
        finalResults.push( {x: $rootScope.line.labels[i],
                            value:  $rootScope.line.data[0][i],
                            otherValue: $rootScope.line.data[1][i]});

      }


      console.log(finalResults);

      var maxTweets = $rootScope.line.data[0].sort(function(a,b){
        return a-b;
      })[6];



        $scope.data = finalResults;

        $scope.options = {
        axes: {
          x: {key: 'x', labelFunction: function(value) {return value;}, type: 'linear', min: -3, max: 3, ticks: 1},
          y: {type: 'linear', min: 0, max: maxTweets, ticks: 2},
          y2: {type: 'linear', min: 0, max: totalRetweets/maxTweets, ticks: 2}
        },
        series: [
          {y: 'value', type: "column", color: 'orange', label: '# of Retweets'},
          {y: 'otherValue', type: "line",  axis: 'y2', color: 'black', visible: true, drawDots: true, dotSize: 2}
        ],

        tension: 0.2,
        tooltip: {mode: 'scrubber', formatter: function(x, y, series) {return '# of Retweets';}},
        drawLegend: true,
        drawDots: true,
        columnsHGap: 0
      }





      $scope.searchTerm = '';
    });
  };

  $scope.load = function() {
    clientFactory.getPortfolio().then(function(data) {
      $scope.portfolio = data.data;

      $scope.networth = 0;
      for (var i = 0; i < data.data.stocks.length; i++) {
          $scope.networth += data.data.stocks[i].current_price * data.data.stocks[i].shares;
      }
      $scope.networth += $scope.portfolio.cash_balance;
    })
  }

  /** buy function that sends the stock information to the helper function on the factory, then redirects to dashboard
  * @param {string} shares - a string of the integer of shares being purchased
  */
  $scope.buyStock = function(shares){
    var date = new Date();
    var purchase = {
      "screen_name": $scope.stocks[0].screen_name,
      "name": $scope.stocks[0].name,
      "follower_count_at_purchase": $scope.stocks[0].follower_count_at_query_time,
      "price_at_purchase": $scope.stocks[0].price_at_purchase,
      "date_of_purchase": date.toString(),
      "shares": +shares,
      "sentiment" : $scope.stocks[0].sentiment
    };

    console.log($scope.stocks[0].sentiment);
    clientFactory.buyStock(purchase).then(function(data){
      console.log("Data received from portfolio controller to search.js: ", data)
        if(data.data === "Overdraft! You cannot buy this stock!") {
          alert("Overdraft! You cannot buy this stock!");
        }
        if(data.data === "In this version, you cannot buy the same stock twice. Try again.") {
          alert("In this version, you cannot buy the same stock twice. Try again.");
        }

        $location.path('/dashboard');
    });
  }

  $scope.load();

});
