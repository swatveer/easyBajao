//Creator Swatantra Kumar Verma
var app = angular.module('easyBajao', ['ui.bootstrap']);
var player;
var playerState = -1;
var scrollingValue = 20;
var initialVideoId = 'Ybv_klIiTOY';

function gapiInit(){
	gapi.client.setApiKey('AIzaSyDcDEoRKC-CINiThEyeq8XXT6hpm53jDxo');
	gapi.client.load('youtube', 'v3', function(){
		var scope = angular.element(document.getElementById('topCont')).scope();
		scope.getRelatedVideos();
	});
}

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		autoplay: 0,
		height: '360',
		width: '100%',
		playerVars : {
			autoplay: 1,
      		cc_load_policy: 1
		},
		events: {
			'onReady' : playFromQueueOrInitial,
			'onStateChange' : onPlayerStateChange
		}
	});
}

function findPosOfVideo(id, videosList){
	for(var i =0 ;i<videosList.length;i++){
		if(id == videosList[i].id)
			return i;
	}
}

function playFromQueueOrInitial(event){
	var scope = angular.element(document.getElementById('topCont')).scope();
	if(scope.sharedObj.queuedVideosList.length >=1 ){
		player.loadVideoById(scope.sharedObj.currentVideoId);
		var pos = findPosOfVideo(scope.sharedObj.currentVideoId, scope.sharedObj.queuedVideosList);
		scope.sharedObj.currentVideo = pos+1;
	}else{
		player.loadVideoById('Ybv_klIiTOY');
	}
}

function getRelatedVideos(){
	var scope = angular.element(document.getElementById('topCont')).scope();
	scope.getRelatedVideos();
}

function onPlayerStateChange(event){
	playerState = event.data;
	var scope = angular.element(document.getElementById('nav_search')).scope();
	scope.enableSearch();
	if(playerState == 0){
		var scope = angular.element(document.getElementById('queuedContainer')).scope();
		scope.nextVideoWithApply();
	}
}

document.addEventListener("keydown", topKeyDownHandler, false);
document.addEventListener("click", clickHandler, false);
document.getElementById("nav_search").addEventListener("click", stopProp, false);


function topKeyDownHandler(e) {
  var keyCode = e.keyCode;

  if(keyCode == 13){
  	if(playerState == 1)
  		player.pauseVideo();
  	else if(playerState == 2)
  		player.playVideo();
  }
}

function clickHandler(e) {
	if(angular){
		var scope = angular.element(document.getElementById('nav_search')).scope();
		if(scope){
			scope.relatedVideosList = [];
			scope.$apply();
		}
	}
}

function stopProp(e){
	e.stopPropagation();
}

function loadResultsIfNotEmpty(){
	if(angular){
		var scope = angular.element(document.getElementById('nav_search')).scope();
		if(scope && scope.searchString !== ''){
			scope.searchVideoResults();
		}
	}
}

app.controller('topController',function($scope,$location){
	$scope.sharedObj = {
		player : '',
		currentVideoId : 'Ybv_klIiTOY',
		searchVideoString : '',
		currentVideo : 0,
		queuedVideosList : [],
		playVideo : 0,
		videoQuality : 'default',
		relatedVideos : []
	};

	$scope.initialize = function(){
		if(typeof(Storage) !== "undefined"){
			if(!localStorage.videoList){
				localStorage.setItem("videoList","");
			}
			else{
				$scope.sharedObj.queuedVideosList = JSON.parse(localStorage.videoList);
				if(localStorage.currentVideoId && localStorage.currentVideoId != ''){
					$scope.sharedObj.currentVideoId = localStorage.currentVideoId;
				}
				else
					$scope.sharedObj.currentVideoId = $scope.sharedObj.queuedVideosList[0].id;
			}
		}
	}

	$scope.fetchVideoInformation = function(data){
		var relatedDivLength = data.length;
		for (var i = 0; i < relatedDivLength; i++){
			var video = new Object();
			video.id = data[i].id.videoId;
			video.title = data[i].snippet.title;
			video.img = data[i].snippet.thumbnails.default.url;
			$scope.sharedObj.relatedVideos.push(video);
		}
	}

	$scope.getRelatedVideos = function(){
		$scope.sharedObj.relatedVideos = [];
		var request = gapi.client.youtube.search.list({
				part: 'snippet',
				relatedToVideoId : $scope.sharedObj.currentVideoId,
				maxResults : 10,
				type : 'video',
				videoEmbeddable : true
			});

			request.execute(function(response) {
				if(response.items && response.items.length > 0 ){
					$scope.fetchVideoInformation(response.items);
				}
				else{
					//show error
				}
		});
	}
	$scope.initialize();
});

app.controller('queuedVideosController',function($scope,$location,$timeout){
	$scope.qualityList = {
		medium : 'small',
		large : 'medium',
		hd720 : 'large',
		default : 'default'
	}
	$scope.playAgainCheck = false;
	$scope.selectedIndex = 0;
	$scope.sharedObj.playVideo = 0;
	$scope.timerPromise = '';

	$scope.changeQuality = function(quality, index){
		$scope.selectedIndex = index;
		$scope.sharedObj.videoQuality = quality;
	}

	$scope.playAgainPlaylist = function(){
		$scope.playAgainCheck = $scope.playAgainCheck ? false : true;
	}

	$scope.play = function(){
		if(playerState == 1)
			return;
		else
			player.playVideo();
	}

	$scope.pause = function(){
		if(playerState == 1)
			player.pauseVideo();
	}

	$scope.prevVideo = function(){
		var videoCounter = $scope.sharedObj.queuedVideosList.length;
		if(videoCounter > 1 && $scope.sharedObj.currentVideo > 1){
			player.loadVideoById({videoId : $scope.sharedObj.queuedVideosList[$scope.sharedObj.currentVideo-2].id, suggestedQuality : $scope.sharedObj.videoQuality});
			$scope.sharedObj.currentVideoId = $scope.sharedObj.queuedVideosList[$scope.sharedObj.currentVideo-2].id;
			$scope.sharedObj.playVideo = $scope.sharedObj.currentVideo-2;
			$scope.sharedObj.currentVideo -= 1;
		}

		if(typeof(Storage) !== "undefined"){
			localStorage.currentVideoId = $scope.sharedObj.currentVideoId;
		}
		$scope.getRelatedVideos();
	}

	$scope.nextVideoWithApply = function(){
		$scope.nextVideo();
		if(!$scope.$$phase) {
  			$scope.$apply();
		}
	}

	$scope.nextVideo = function(){
		var videoCounter = $scope.sharedObj.queuedVideosList.length;
		var enteredRandomIf = false;
		if($scope.sharedObj.currentVideo < videoCounter){
			player.loadVideoById({videoId : $scope.sharedObj.queuedVideosList[$scope.sharedObj.currentVideo].id, suggestedQuality : $scope.sharedObj.videoQuality});
			$scope.sharedObj.currentVideoId = $scope.sharedObj.queuedVideosList[$scope.sharedObj.currentVideo].id;
			$scope.sharedObj.playVideo = $scope.sharedObj.currentVideo;
			$scope.sharedObj.currentVideo++;
			$scope.getRelatedVideos();

		}else{
			if($scope.sharedObj.currentVideo == videoCounter){
				if($scope.playAgainCheck){
					$scope.sharedObj.currentVideo = 0;
					if(videoCounter > 0)
						$scope.nextVideo();
				}
				else{
					if($scope.sharedObj.relatedVideos){
						enteredRandomIf = true;
						player.loadVideoById({videoId : $scope.sharedObj.relatedVideos[Math.floor(Math.random() * $scope.sharedObj.relatedVideos.length)].id, suggestedQuality : $scope.sharedObj.videoQuality});
						$scope.sharedObj.currentVideoId = $scope.sharedObj.relatedVideos[Math.floor(Math.random() * $scope.sharedObj.relatedVideos.length)].id;
						$scope.sharedObj.playVideo = $scope.sharedObj.currentVideo;
						$scope.getRelatedVideos();
						$scope.$apply();
					}
				}
			}
			else
				$scope.sharedObj.currentVideo = 1;
		}
		if(typeof(Storage) !== "undefined" && !enteredRandomIf){
			localStorage.currentVideoId = $scope.sharedObj.currentVideoId;
		}
	}

	$scope.removeVideo = function(id,index){
		if(index < $scope.sharedObj.queuedVideosList.length){
			if(id == $scope.sharedObj.currentVideoId){
				$scope.sharedObj.queuedVideosList.splice(index,1);
				if($scope.sharedObj.queuedVideosList.length-1 == (index-1) || $scope.sharedObj.queuedVideosList.length == 0){
					$scope.sharedObj.currentVideo = 0;
					player.stopVideo();
					player.clearVideo();
					$scope.sharedObj.playVideo = 0;
				}else if($scope.sharedObj.queuedVideosList.length != 0){
					$scope.sharedObj.currentVideo--;
					$scope.nextVideo();
				}
			}else{
				if($scope.sharedObj.currentVideo-1 >index){
					$scope.sharedObj.currentVideo--;
					$scope.sharedObj.playVideo -=1;
				}
				$scope.sharedObj.queuedVideosList.splice(index,1);
			}
		}
		if(typeof(Storage) !== "undefined"){
			localStorage.videoList = JSON.stringify($scope.sharedObj.queuedVideosList);
		}
	}

	$scope.scrollLeft = function(pos) {
		var leftScroll = document.getElementById('scrollDiv');
		var liElement = document.getElementById('qvideoContainer');
		leftScroll.scrollLeft -= (pos);
	}

	$scope.scrollLeftMouseDown = function(){
		$scope.timerPromise = $timeout( function() { $scope.scrollLeft(scrollingValue); scrollingValue+=20;}, 1000);
	}

	$scope.scrollLeftMouseUp = function(){
		$timeout.cancel($scope.timerPromise);
	}

	$scope.scrollRight = function() {
		var rightScroll = document.getElementById('scrollDiv');
		var liElement = document.getElementById('qvideoContainer');
		rightScroll.scrollRight += 20
	}

	$scope.clearPlaylist = function(){
		if($scope.sharedObj.queuedVideosList.length > 0){
			$scope.sharedObj.queuedVideosList = [];
			if(playerState == 1 || playerState == 2){
				player.stopVideo();
			}
			if(typeof(Storage) !== "undefined"){
				localStorage.videoList = [];
				localStorage.currentVideoId = '';
			}
		}
	}

	$scope.isNextDisabled = function(e){
		if($scope.currentVideo >= $scope.sharedObj.queuedVideosList.length)
			return true;
		return false;
	}

	$scope.isPrevDisabled = function(e){
		if($scope.currentVideo <= 1 )
			return true;
		return false;
	}

	$scope.changeVideo = function(id,index){
		player.loadVideoById({videoId : id, suggestedQuality : $scope.sharedObj.videoQuality});
		$scope.sharedObj.currentVideoId = id;
		$scope.sharedObj.playVideo = index;
		$scope.sharedObj.currentVideo = index+1;
		if(typeof(Storage) !== "undefined"){
			localStorage.currentVideoId = id;
		}
		$scope.getRelatedVideos();
	}
});


app.controller('relatedVideosController', function($scope, $http){
	$scope.addVideoToPlaylist = function(video){
		$scope.sharedObj.queuedVideosList.push(video);

		if(typeof(Storage) !== "undefined"){
			localStorage.videoList = JSON.stringify($scope.sharedObj.queuedVideosList);
		}
	}

	$scope.changeVideo = function(id){
		if(playerState == 1 || playerState == 2){
			player.clearVideo();
			player.loadVideoById({videoId :id, suggestedQuality : $scope.sharedObj.videoQuality});
			$scope.sharedObj.currentVideoId = id;
		}
		player.loadVideoById({videoId :id, suggestedQuality : $scope.sharedObj.videoQuality});
		$scope.sharedObj.currentVideoId = id;
		if($scope.sharedObj.currentVideo >= 1)
			$scope.sharedObj.currentVideo--;

		$scope.getRelatedVideos();
	}
});

app.controller('searchController', function($scope,$http){
	$scope.searchString = '';
	$scope.relatedVideosList = [];
	var request = {};
	$scope.disableSearch = true;
	$scope.gapiError = false;
	$scope.gapiErrorMsg = '';

	$scope.fetchVideoIdAndRelatedVideos = function(data){
		$scope.relatedVideosList = [];
		var relatedDivLength = data.length;
		for (var i = 0; i < relatedDivLength; i++){
			var video = new Object();
			video.id = data[i].id.videoId;
			video.title = data[i].snippet.title;
			video.img = data[i].snippet.thumbnails.default.url;
			$scope.relatedVideosList.push(video);
		}
		$scope.$apply();
	}

	$scope.enableSearch = function(){
		$scope.disableSearch = false;
		$scope.$apply();
	}

	$scope.changeVideo = function(id){
		if(playerState == 1 || playerState == 2){
			player.clearVideo();
			player.loadVideoById({videoId :id, suggestedQuality : $scope.sharedObj.videoQuality});
			$scope.sharedObj.currentVideoId = id;
		}
		player.loadVideoById({videoId :id, suggestedQuality : $scope.sharedObj.videoQuality});
		$scope.sharedObj.currentVideoId = id;
		if($scope.sharedObj.currentVideo >= 1)
			$scope.sharedObj.currentVideo--;

		if(typeof(Storage) !== "undefined"){
			localStorage.searchedVideoId = id;
		}
		$scope.getRelatedVideos();
		$scope.relatedVideosList = [];
	}

	$scope.searchVideoResults = function(){
		var url = "http://suggestqueries.google.com/complete/search?callback=JSON_CALLBACK";
	 	if($scope.searchString != ''){
		 	$http.jsonp(url,{
                params : {
    				"hl":"en",
    				"ds":"yt",
    				"q":$scope.searchString,
    				"client":"youtube"
                }
			}).success(function(data){
				if(typeof(Storage) !== "undefined"){
					localStorage.searchTerm = $scope.searchString;
				}

            	if(data[1] && data[1].length> 0){

            		if(!gapi.client.youtube){
            			$scope.gapiError = true;
            			$scope.gapiErrorMsg = 'Please wait for sometime';
            		}

            		request = gapi.client.youtube.search.list({
						q: data[1][0][0],
						part: 'snippet',
						maxResults : 10,
						type : 'video',
						videoEmbeddable : true
					});

					request.execute(function(response) {
						if(response.items && response.items.length > 0 ){
							$scope.fetchVideoIdAndRelatedVideos(response.items);
						}
						else{
							//show error
						}
					});
            	}
            }).error(function(data){
                // error code goes here.
            });
	 	}else{
	 		$scope.relatedVideosList = [];
	 	}
	};

	$scope.selectVideo = function(video){
		$scope.sharedObj.queuedVideosList.push(video);
		if($scope.sharedObj.queuedVideosList.length ==1 && (playerState==0 || playerState == -1)){
			player.loadVideoById({videoId : video.id, suggestedQuality : $scope.sharedObj.videoQuality});
			$scope.sharedObj.currentVideoId = video.id;
			$scope.sharedObj.currentVideo++;
			$scope.getRelatedVideos();
		}
		else if(playerState == 0){
			player.loadVideoById({videoId : video.id, suggestedQuality : $scope.sharedObj.videoQuality});
			$scope.sharedObj.currentVideoId = video.id;
			$scope.sharedObj.currentVideo = $scope.sharedObj.queuedVideosList.length;
			$scope.sharedObj.playVideo = $scope.sharedObj.queuedVideosList.length-1;
			$scope.getRelatedVideos();
		}

		if(typeof(Storage) !== "undefined"){
			localStorage.videoList = JSON.stringify($scope.sharedObj.queuedVideosList);
			localStorage.currentVideoId = video.id;
		}
	}
});
