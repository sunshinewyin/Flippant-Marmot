angular.module('socialStock.search', [])


/** This is a controller to dictate search functions with the use of the helper functions in the clientFactory */
.controller('SearchController', function ($scope, $location, clientFactory) {

  $scope.portfolio;
  $scope.networth;

  /** search function to get follower data and current price of stock
  * @param {string} handle - The twitter handle searching
  */
  $scope.search = function(handle){
    clientFactory.getTwitterInfo(handle).then(function(data){
      $scope.stocks = [data.data];
      console.log($scope.stocks);
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
