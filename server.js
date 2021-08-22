const result = require('dotenv').config();
const express = require('express');
const sessions = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');
var alert = require('alert');

const app = express();

const port = process.env.PORT;

if(result.error){
    throw result.error
}else{
    console.log(result.parsed);
}

const url = process.env.MONGODB_URI;

var session;

const oneDay = 1000*60*60*48;

//session middleware
app.use(sessions({
    secret:process.env.SECRET_KEY,
    saveUninitialized:true,
    cookie:{ maxAge:oneDay },
    resave:false
}));

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser()); //cookie parser middleware
app.post('/signup',(req,res)=>{
    res.set({
        'Access-Control-Allow-Origin':'*'
    });
    var pass = req.body.password;
    var email = req.body.email;
    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var data = {
        "firstname":firstname,
        "lastname":lastname,
        "email":email
    }
    console.log(JSON.stringify(data));
    MongoClient.connect(url,(err,db)=>{
        if(err) throw err;
        console.log("Database Connected");
        var dbo = db.db("logerdb");
        const saltRounds = 10;
        bcrypt.genSalt(saltRounds,(err,salt)=>{
            if(err) throw err;
            bcrypt.hash(pass,salt,(err,hash)=>{
                if(err) throw err;
                data["password"] = hash;
                console.log(JSON.stringify(data));
                dbo.collection("userdata").insertOne(data,(err,result)=>{
                    if(err) throw err;
                    console.log(result);
                    res.redirect('/AUTH/login.html');
                });
            });
        });
    });
});

app.post('/login',(req,res)=>{
    res.set({
        'Access-Control-Allow-Origin':'*'
    });
    var password = req.body.password;
    var email = req.body.email;

    MongoClient.connect(url,(err,db)=>{
        if(err) throw err;
        console.log("Database Connected");
        var dbo = db.db("logerdb");
        var query = {email:email};
        dbo.collection("userdata").findOne(query,(err,result)=>{
            if(err) throw err;
            console.log(result);
            var hash_pass = result.password;
            var validPassword = bcrypt.compareSync(password,hash_pass);
            if(validPassword){
                session = req.session;
                session.userid = req.body.email;
                console.log(req.session);
                res.redirect('/public/home.html');
            }
            else{
                alert("Incorrect email or password");
                res.redirect('/AUTH/login.html');
            };
        });
    });
});

app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
})

app.get('/',(req,res)=>{
    session = req.session;
    if(session.userid){
        res.set({
            'Access-Control-Allow-Origin':'*'
        });
        res.redirect('/public/home.html');      
    }else{
        res.redirect('/AUTH/login.html');
    }
}).listen(port,()=>{
    console.log(`Server is listening at ${port}`);
});

app.post('/email',(req,res)=>{
    res.set({
        'Access-Control-Allow-Origin':'*'
    });
    var newsletterEmail = req.body.email;
    var newsletter = {
        "newslettermail":newsletterEmail
    }
    MongoClient.connect(url,(err,db)=>{
        if(err) throw err;
        console.log("Database is still on....");
        var dbo = db.db("logerdb");
        dbo.collection("subscribers").insertOne(newsletter,(err,result)=>{
            if(err) throw err;
            console.log(`${result.newslettermail} has subscribed successfully`);
            res.redirect('/views/results.html');
        });
    });
});

app.post('/changePassword',(req,res)=>{
    res.set({
        'Access-Control-Allow-Origin':'*'
    });
    var user_email = req.body.email;
    var newPassword = req.body.password;

    MongoClient.connect(url,(err,db)=>{
        if(err) throw err;
        console.log("Database Connected...")
        var dbo = db.db("logerdb");
        const saltRounds = 10;
        bcrypt.genSalt(saltRounds,(err,salt)=>{
            if(err) throw err;
            bcrypt.hash(newPassword,salt,(err,hash)=>{
                if(err) throw err;
                var query = {email:user_email};
                console.log(query);
                dbo.collection("userdata").findOne(query,(err,result)=>{
                    if(err) throw err;
                    console.log(result);
                    if(result != undefined){
                        var user_pass = { $set:{password:hash} };
                        dbo.collection("userdata").updateOne(query,user_pass,(err,result)=>{
                            if(err) throw err;
                            console.log(`Password changed for ${user_email} of `+result.firstname);
                            res.redirect('/AUTH/login.html');
                        })
                    }else{
                        res.send("A user with that email does not exist <a href=\'/AUTH/forgot.html'> Try Again</a>");
                    }
                })
            });
        });
    });
});
