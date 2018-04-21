var express = require('express');
var fs = require('fs');
var session = require("express-session");
var flash = require("express-flash");
var bcrypt = require("bcrypt");
var mongoClient = require('mongodb').MongoClient;
var users;
var DATABASE_NAME = "development_db";
var USERS_COLLECTION = "users";

var app = express();
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(flash());
app.use(session({
  name:"session",
  secret: "the_legend_begins",
  maxAge: 1000 * 60 * 30
}));

//connect to mongo
var url = "mongodb://ksach:ilmfvm26@ds247759.mlab.com:47759/development_db";
mongoClient.connect(url,function(err,client){
  if(err) throw err;
  users = client.db(DATABASE_NAME).collection(USERS_COLLECTION);
  console.log("successfully connected to " + DATABASE_NAME + "database");
});


var PORT = process.PORT || 3000;
var users = [{email:"karansachdev886@gmail.com",password:"password"}];

app.get('/',function(req,res,next){
  res.send(fs.readFileSync('./resources/login.html').toString());
});

app.listen(PORT);
console.log("listening on port " + PORT);
