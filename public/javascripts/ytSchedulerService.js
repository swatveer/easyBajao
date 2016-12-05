var app = angular.module('ytScheduler');

app.factory('ytSchedulerService', function($http, $q){

	var factory = {};

	
	factory.fetchSuggestions = function(){

		var deferred = $q.defer();
		
		

		

		return deferred.reject('error occured');
	}
	
	return factory;

});