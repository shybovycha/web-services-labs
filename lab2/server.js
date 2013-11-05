var express = require("express");

var app = express();
var port = 80;

app.set('views', __dirname + '/views');
app.set('view engine', "jade");

app.engine('jade', require('jade').__express);

app.use(express.static(__dirname + '/public'));

app.get("/", function(req, res){
    res.render("page");
});

var io = require('socket.io').listen(app.listen(port));

console.log("Listening on port " + port);

io.sockets.on('connection', function (socket) {
    socket.emit('message', { message: 'Greetings!' });

    socket.on('send', function (data) {
        io.sockets.emit('message', data);
    });
});