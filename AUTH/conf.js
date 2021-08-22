var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/logerdb";

var check = function () {
    var password = document.getElementById('psw').value;
    var password2 = document.getElementById('confpsw').value

    if(password == password2){
        document.getElementById('message').style.color='green';
        document.getElementById('message').innerHTML = 'Matching';
    }else{
        document.getElementById('message').style.color='red';
        document.getElementById('message').innerHTML = 'Password Do Not Match!';
    }
}

function showPassword(){
    var x = document.getElementById('psw');
    if(x.type === "password"){
        x.type = "text"
    }else{
        x.type = "password";
    }
}

var isMail = ()=>{
    var user_mail = document.getElementById('mail');
    MongoClient.connect(url,(err,db)=>{
        if(err) throw err;
        var query = {email:user_mail};
        var dbo = db.db("logerdb")
        dbo.collection("userdata").findOne(query,(err,result)=>{
            if(err) throw err;
            if(result == undefined){
                document.getElementById("message1").style.color='green';
                document.getElementById("message1").innerHTML='Correct Email';                              
            }else{
                document.getElementById("message1").style.color="red";
                document.getElementById("message1").innerHTML='User with that email exists';
            }
        });
    });
}