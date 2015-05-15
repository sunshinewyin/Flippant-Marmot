angular.module('socialStock', [
  'socialStock.header',
  'socialStock.auth',
  'socialStock.dash',
  'socialStock.search',
  'socialStock.factory',
  'ui.router',
  'chart.js',
  'socialStock.charts'
])
.config(function($stateProvider,$urlRouterProvider, $httpProvider) {
  
  $urlRouterProvider.otherwise('/master/dashboard');
  
  $stateProvider
    .state('master', {
      url:'/master',
      templateUrl: 'app/views/master.html',
      }).state('master.home',{
        url:'/dashboard',
        controller: 'DashController',
        templateUrl:'app/dashboard/dashboard.html',
    }).state('master.search', {
        url:'/search',
        templateUrl:'app/search/search.html',
        controller: 'SearchController'
    }).state('master.logout', {
        url:'/logout',
        templateUrl:'app/search/search.html',
        controller: 'DashController'
    }).state('chart', {
      url: '/chats', 
      templateUrl: '/app/chart/charts.html',
      controller: 'chartsController'
    })
})
