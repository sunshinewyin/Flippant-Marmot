angular.module('socialStock.charts',[])
	.directive('chartWidegts',function(){
 
		return {
	        templateUrl:'app/directives/chartWidegtDirective.html',
	        restrict: 'E',
	        replace: true,
	        scope: {
		        'model': '=',
		        'chartDataArray': '@'
  			}
    	}
	});
