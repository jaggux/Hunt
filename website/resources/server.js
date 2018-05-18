var express = require('express');
var fs = require('fs');
var session = require("express-session");
var flash = require("express-flash");
var bcrypt = require("bcrypt");
var mongoClient = require('mongodb').MongoClient;
var users;
var activeUsers = new Array();
var path = require("path");
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
//app.use("/",express.static("./jquery-ui-1.12.1"));
app.use("/",express.static("."));
app.use("/",express.static("./fonts"));

//connect to mongo
var url = "mongodb://ksach:ilmfvm26@ds247759.mlab.com:47759/development_db";
mongoClient.connect(url,function(err,client){
  if(err) throw err;
  users = client.db(DATABASE_NAME).collection(USERS_COLLECTION);
  console.log("successfully connected to " + DATABASE_NAME + "database");
});


var PORT = process.PORT || 3000;

function serveDynamicPage(path,valObj){
  var oldHTML = fs.readFileSync(path).toString();
  for(regex in valObj){
    var regexBuilder = new RegExp(regex);
    oldHTML = oldHTML.replace(regexBuilder,valObj[regex]);
  }
  return oldHTML;
}

/*app.get("/resources/:filename",function(req,res,next){
  var filename = req.params.filename;
  var url = "./"+filename;
  fs.readFile(url,function(err,content){
    if(err) res.end("404 error cannot get " + filename);
    if(content){
      res.send(content.toString());
    }else{
      res.end("404 error cannot get " + filename);
    }
  });
});*/

app.get('/',function(req,res,next){
  var error_message = req.flash('error');
  if(error_message){
    res.send(serveDynamicPage('./login.html',{
      "<div id='error-block'><span id = 'error'>[.]*</span></div>": "<div id='error-block'><span id = 'error'>"+error_message+"</span></div>"
    }));
  }else{
    res.send(fs.readFileSync('./login.html').toString());
  }
});

app.post('/log-in',function(req,res,next){
  if(users){
    users.find({email:req.body.email}).toArray(function(err,array){
      if(err) throw err;
      if(array[0]){
        //authenticate password
        bcrypt.compare(req.body.password,array[0].password,function(err,resp){
          if(err) throw err;
          console.log(resp);
          if(resp == true){
            //matched
            req.session.user = array[0];
            activeUsers.push(array[0]);
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

/*app.get('/hash/:uname/:password',function(req,res,next){
  var username = req.params.uname;
  var password = req.params.password;

  bcrypt.hash(password,bcrypt.genSaltSync(10),function(error,hash){
    if(error) throw error;
    if(users){
      users.insert({username:username,password:hash,email:"karansachdev886@gmail.com",admin:true});
      res.end(hash);
    }
  });

});*/


app.get('/load-hunt',function(req,res,next){
  if(req.session.user){
    var key = req.session.user.username;
    var email = req.session.user.email;

    users.find({username:key,email:email}).toArray().then(function(array){
      res.send(JSON.stringify(array[0].hunts));
    });
  }else{
    req.flash('error','! your session has expired');
    res.redirect('/log-in');
  }
});

app.get('/load-hunt/:id',function(req,res,next){
  var user = req.session.user;
  var id = req.params.id;
  if(user){
    res.send(user.hunts[id]);
  }else{
    req.flash('error','! your session has expired');
    res.redirect('/log-in');
  }
});
app.get('/dashboard',function(req,res,next){
  if(req.session.user){
    var username = req.session.user.username;
    var totalHunts = req.session.user.hunts.length;
    var score = req.session.user.score;
    res.send(serveDynamicPage("../private/dashboard.html",{
      "<h1 id = 'username-container'>[.]*</h1>":"<h1 id = 'username-container'>welcome to the hunt, "+ username +"</h1>",
      "<span id = 'hunts'>[.]*</span>":"<span id = 'hunts'>"+totalHunts+"</span>",
      "<span id = 'score'>[.]*</span>":"<span id = 'score'>"+score+"pts</span>"

    }));
  }else{
    req.flash('error','! your session has expired, please login again');
    res.redirect('/log-in');
  }
});

app.get("/logout",function(req,res,next){
  req.session.regenerate(function(err){
    if(err) throw err;
    req.flash('error','! you have logged out');
    res.redirect('/');
  });
});

app.get("/canvas",function(req,res,next){
  if(req.session.user){
    res.send(fs.readFileSync("../private/canvas.html").toString());
  }else{
    req.flash('error','! your session has expired, please login again');
    res.redirect('/log-in');
  }
});

app.post('/save-hunt',function(req,res,next){
  if(req.session.user){
    var key = req.session.user.username;
    var email = req.session.user.email;
    var obj = new Object();
    obj.clues = JSON.parse(req.body.clues);
    obj.date = req.body.date;
    obj.hid = req.session.user.hunts.length;
    users.update({username:key,email:email},{$addToSet:{hunts:obj}},function(err){
      if(err){
        throw err;
      }else{
        res.send('200');
      }
    });
  }else{
    req.flash('error','! your session has expired');
    res.redirect('/log-in');
  }
});

app.delete('/delete-hunt/:id',function(req,res,next){
  var user = req.session.user;
  if(user){
    var hunts = user.hunts.splice(req.params.id,1);
    users.update({username:user.username},{$set:{hunts:hunts}},function(err){
      if(err) res.send(300);
      res.send(200);
    });

  }else{
    req.flash('error','! your session has expired');
    res.redirect('/log-in');
  }
});

app.listen(PORT);
console.log("listening on port " + PORT);
