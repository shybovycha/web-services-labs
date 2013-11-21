var express = require("express");
var GameServer = require("./game_server");

var app = express();
var port = 80;

var game = new GameServer(port, app);

app.set('views', __dirname + '/views');
app.set('view engine', "jade");

app.engine('jade', require('jade').__express);

app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("index");
});

app.get("/join", function(req, res){
    res.render("guest_game");
});

app.get("/create", function(req, res){
    res.render("host_game");
});