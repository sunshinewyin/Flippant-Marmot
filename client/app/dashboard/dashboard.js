angular.module('socialStock.dash', [])

.controller('DashController', function($scope, $http, clientFactory) {
  console.log("inside DashController!")


    $scope.line = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
      data: [
        [65, 59, 80, 81, 56, 55, 40] ]
    }



  $scope.portfolio;
  $scope.networth;

  $scope.updatePie = function(portfolio) {
    var MAX_ASSETS = pieColors.length - 2;
    var values = [];
    var labels = [];
    var stocks = portfolio.stocks;
    var netWorth = portfolio.cash_balance;
    var stockValue = 0;
    var assets = [];
    values.push(+portfolio.cash_balance.toFixed(2));
    labels.push('Cash');
    // put all the stock assets in a name/value array
    for (var i = 0; i < portfolio.stocks.length; i++) {
      stockValue = stocks[i].current_price * stocks[i].shares;
      netWorth += stockValue;
      stockValue = +stockValue.toFixed(2);
      assets.push({name: stocks[i].screen_name, value: stockValue});
    }
    // sort by descending value
    assets = assets.sort(function(a, b) {
        return b.value - a.value;
    });
    //console.log('sorted assets: ', JSON.stringify(assets));
    var assetValue = 0;
    for (var i = 0; i < assets.length && i < MAX_ASSETS; i++) {
      values.push(assets[i].value);
      labels.push(assets[i].name);
      assetValue += assets[i].value;
    }
    var otherValue = netWorth - portfolio.cash_balance - assetValue;
    if (otherValue > 0 && assets.length > MAX_ASSETS) {
      values.push(otherValue);
      labels.push('Other');
    }
    // values.unshift(netWorth);
    // console.log('labels: ', labels, 'values: ', values);
    // console.log('pie colors: ', JSON.stringify(pieColors));
    var content = [];
    for (var i = 0; i < values.length; i++) {
      content.push({label: labels[i], value: values[i], color: pieColors[i]});
    }
    pieConfig.data.content = content;
    // console.log('PIE DATA: ', JSON.stringify(pieConfig, null, '\t'));
     var pie = document.querySelector('svg');
     if (pie) {
       console.log('old pie removed');
       pie.parentNode.removeChild(pie);
     }
    var pieWidth = document.body.clientWidth * .4;
      var pieHeight = pieWidth * 0.9;
      pieConfig.size.canvasHeight = pieHeight;
      pieConfig.size.canvasWidth = pieWidth
      var pie = new d3pie("pieChart", pieConfig);
  }


  /**
   * This function refreshes the dashboard with the user's most recent portfolio data.
   * It uses the getPortfolio function in the clientFactory factory.
   * Asynchronous.
   */
  $scope.refresh = function() {
    clientFactory.getPortfolio().then(function(data) {
      $scope.portfolio = data.data;

      $scope.networth = 0;
      for (var i = 0; i < data.data.stocks.length; i++) {
          $scope.networth += data.data.stocks[i].current_price * data.data.stocks[i].shares;
      }
      $scope.networth += $scope.portfolio.cash_balance;
      $scope.updatePie($scope.portfolio);
    })
  }


  /**
   * This function sells a given stock when the user chooses to do from the dashboard.
   *  @param {String} sn - screen_name of stock to sell
   *  @param {String} name - name of stock to sell
   *  @param {String} cfc - current follower count of stock to sell
   *  @param {Date} cd - current date
   *  @param {Number} cp - current price of stock to sell
   *  @param {Number} s - number of stocks to sell
   */
  $scope.createAndSell = function(sn, name, cfc, cd, cp, s, sentiment) {

    var stockToSell = {
      "screen_name": sn,
      "name": name,
      "current_follower_count": cfc,
      "current_date": cd,
      "current_price": cp,
      "shares": s,
      "sentiment" : sentiment, 
    }

    clientFactory.sellStock(stockToSell).then(function(data) {
      $scope.portfolio = data.data;

      $scope.refresh();
    })


  }


  $scope.refresh();

}).directive('chartwidegt',function(){
  console.log("**********************");
 
    return {
          templateUrl:'app/directives/chartWidget.html',
          restrict: 'E',
          replace: true,
          scope: {
            'model': '=',
            'dataObj': '@',
          }
      }
  }) .controller('chartController', function($scope, $http, clientFactory) {
        console.log("inside DashController!");

    });












