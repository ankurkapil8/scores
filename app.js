var express = require("express");
const config = require("./config");

//import dbconfig from './config';
var app = express();
const bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
app.set('superSecret', "scores");
const routes = require("./controllers/scores");
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
app.use('/', routes);

