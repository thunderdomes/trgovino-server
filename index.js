var express = require('express');
var schedule = require('node-schedule');
var request = require("request");
var app = express();

/*

*/
var _save_data = {};

var getData = function(){
	request("http://202.53.249.3/mi2/marketInfoData?request=stockInit", function(error, response, body) {
		var str = body;
		var arr = str.split("\n");
		_save_data = {};
		arr.forEach(function(e, i){
			var data = JSON.parse(e || "null");
			if(data != null){
				var id2 = data.id.split(".");
				if(id2[1] == 'NG'){
					_save_data[id2[0]] = data;
				}
			}
		});
		console.log("data updated");
	});
}
var j = schedule.scheduleJob({hour: 01, minute: 00}, function(){
    getData();
});
 
getData();

app.get('/', function(req, res){
  var body = JSON.stringify(_save_data || null);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

app.get('/:id', function(req, res){
  var id=req.params.id;
  var body = JSON.stringify(_save_data[id] || null);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

app.listen(3000);