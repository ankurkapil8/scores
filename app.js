var express = require("express");
const sqlite3 = require('sqlite3').verbose();
const db = require("./config/connection");
var app = express();
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
app.set('superSecret', "scores");
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');
	// Request methods you wish to allow
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	// Request headers you wish to allow
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
	// Set to true if you need the website to include cookies in the requests sent
	// to the API (e.g. in case you use sessions)
	res.setHeader('Access-Control-Allow-Credentials', true);
	req.headers['content-type'] = req.headers['content-type'] || 'application/json';
	next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/create-user", (req, res, next) => {
  let message = "";
  if(req.body.imageUrl == "" || req.body.imageUrl == undefined){
    return res.json({
      success: false,
      message: 'imageUrl should not empty'
    });	
  }
  if(req.body.uniqueId == "" || req.body.uniqueId == undefined){
    return res.json({
      success: false,
      message: 'uniqueId should not empty'
    });	
  }
  let name = req.body.name;
  let imageUrl = req.body.imageUrl;
  let uniqueId = req.body.uniqueId;
  db.run('INSERT INTO users(name, imageUrl,uniqueId) VALUES(?, ?, ?)', [name,imageUrl,uniqueId], function(err) {
    if(err) {
      return res.json({
        success: false,
        message: err.message
      });	
    }else{
      var payload = {'name':name, 'imageUrl':imageUrl, 'uniqueId' : uniqueId};
      var token = jwt.sign(payload, app.get('superSecret'), {expiresIn: '2h'});
      return res.json({
        success: true,
        token:token,
        ...payload
      });	
    }
  })

});


