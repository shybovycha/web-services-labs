var express = require("express");
var ChatServer = require("./chat_server");

var app = express();
var port = 80;

app.set('views', __dirname + '/views');
app.set('view engine', "jade");

app.engine('jade', require('jade').__express);

app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("page");
});

var chat = new ChatServer(port, app);