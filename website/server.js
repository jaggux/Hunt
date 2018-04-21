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
app.use('/',express.static('./resources'));
//connect to mongo
var url = "mongodb://ksach:ilmfvm26@ds247759.mlab.com:47759/development_db";
mongoClient.connect(url,function(err,client){
  if(err) throw err;
  users = client.db(DATABASE_NAME).collection(USERS_COLLECTION);
  console.log("successfully connected to " + DATABASE_NAME + "database");
});


var PORT = process.PORT || 3000;
var users = [{email:"karansachdev886@gmail.com",password:"password"}];


function serveDynamicPage(path,valObj){
  var oldHTML = fs.readFileSync(path).toString();
  for(regex in valObj){
    var regexBuilder = new RegExp(regex);
    oldHTML = oldHTML.replace(regexBuilder,valObj[regex]);
  }
  return oldHTML;
}

app.get('/',function(req,res,next){
  var error_message = req.flash('error');
  if(error_message){
    res.send(serveDynamicPage('./resources/login.html',{
      "<div id='error-block'><span id = 'error'>[.]*</span></div>": "<div id='error-block'><span id = 'error'>"+error_message+"</span></div>"
    }));
  }else{
    res.send(fs.readFileSync('./resources/login.html').toString());
  }
});

app.post('/log-in',function(req,res,next){
  if(users){
    console.log(req.body.email);
    users.find({email:req.body.email}).toArray(function(err,array){
      if(err) throw err;
      if(array[0]){
        //authenticate password
        bcrypt.compare(req.body.password,array[0].password,function(err,resp){
          if(err) throw err;
          if(resp){
            //matched
            req.session.user = array[0];
            res.redirect('/dashboard');
          }else{
            //incorrect password
            req.flash('error','! your password is incorrect');
            res.redirect('/');
          }
        });
      }else{
        //username does not exist
        req.flash('error','! this email does not exist in our system');
        res.redirect('/');
      }
    });
  }
});

app.listen(PORT);
console.log("listening on port " + PORT);
