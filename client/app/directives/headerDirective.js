angular.module('socialStock.header',[])
	.directive('header',function(){
		return {
        templateUrl:'app/directives/headerDirective.html',
        restrict: 'E',
        replace: true,
    	}
	});
