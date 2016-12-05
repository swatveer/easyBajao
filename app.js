var express = require('express');
var path = require('path');
var http = require('http').Server(express);
var app = express();


app.use(express.static(path.join(__dirname, 'public')));

var server = app.listen(3000, function(){
	var host = server.address().address;
	var port = server.address().port;

});
