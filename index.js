var express = require('express');
var schedule = require('node-schedule');
var request = require("request");
var app = express();
var cronJob = require('cron').CronJob;

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'trgovino',
});

connection.connect(function(err) {
	if(err){
		console.log("database error : "+err);
		process.exit(1);
	}
});

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

var getLocalIndexInit = function(){
	request("http://202.53.249.3/mi2/marketInfoData?request=localIndexInit", function(error, response, body) {
		var str = body;
		var arr = str.split("\n");
		var data_simpan = [];
		
		var now = new Date();
		var date = now.getFullYear()+'-'+ ('00'+(now.getMonth()+1)).slice (-2) +'-'+ ('00'+now.getDay()).slice (-2);
		  date += ' '+('00'+now.getHours()).slice(-2)+':'+('00'+now.getMinutes()).slice(-2)+':'+('00'+now.getSeconds()).slice(-2);
		
		arr.forEach(function(e, i){
			var row = JSON.parse(e || "null");
			if(row != null){	
				row.unshift(date)
				data_simpan.push(row);	
			}
		});
		var sql = "INSERT INTO index_local  VALUES ?";
		connection.query(sql, [data_simpan], function(err) {
			if(err){
				console.log("penyimpanan error : "+err);
				process.exit(1);
			}
		});
		console.log("data updated");
	});
}

var j = new cronJob('00 00 01 * * *', function(){
    getData();
}, null, true);

getData();

var cronLocalIndexInit = new cronJob('*/13 * 9-17 * * 1-5', function(){
    getLocalIndexInit();
}, null, true);

app.get('/', function(req, res){
  var body = JSON.stringify(_save_data || null);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

app.get('/localIndexInit', function(req, res){
	connection.query("select * from index_local where reqtime =  (select max(reqtime) from index_local)", function (err, rows, fields) {
		var body = JSON.stringify(rows || null);
		res.setHeader('Content-Type', 'application/json');
		res.setHeader('Content-Length', body.length);
		res.end(body);
	});
});

app.get('/:id', function(req, res){
  var id=req.params.id;
  var body = JSON.stringify(_save_data[id] || null);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Length', body.length);
  res.end(body);
});

app.listen(3234);