var io = null,
    dbConnection = null;

var mysql = require('mysql');

String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0, l = this.length; i < l; i++) {
        char  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};

var GameServer = function(port, app) {
    io = require('socket.io').listen(app.listen(port));

    console.log("Listening on port " + port);

    this.games = [];
    this.logMessages = true;

    io.sockets.on('connection', this.onConnection.bind(this));

    /*dbConnection = mysql.createConnection({
        host : 'localhost',
        user : 'tic_tac_toe',
        password : 'abc123',
        database: 'tic_tac_toe'
    });

    dbConnection.connect();*/

    process.on('SIGTERM', function() {
        app.close();
    });

    app.on('close', function() {
        // dbConnection.end();
    });
};

GameServer.prototype.onConnection = function(socket) {
    var that = this;

    socket.on('create', function(data) {
        that.handleCreateCommand(data, socket);
    });

    socket.on('join', function(data) {
        that.handleJoinCommand(data, socket);
    });

    socket.on('move', function(data) {
        that.handleMoveCommand(data, socket);
    });
};

GameServer.prototype.getRandomSign = function() {
    return ((Math.random() * 100) > 50) ? 'cross' : 'zero';
};

GameServer.prototype.getNewToken = function() {
    return (new Date()).toString().hashCode();
};

GameServer.prototype.handleCreateCommand = function(data, socket) {
    var sign = this.getRandomSign(),
        token = this.getNewToken();

    this.games.push({
        host_player: {
            socket: socket,
            sign: sign
        },
        guest_player: null,
        token: token
    });

    socket.emit('waiting', { token: token });
};

GameServer.prototype.handleJoinCommand = function(data, socket) {
    var sign = this.getRandomSign();

    for (var i = 0; i < this.games.length; i++) {
        var game = this.games[i];

        if ((game.guest_player == null) && (game.host_player.sign != sign)) {
            game.guest_player = {
                sign: sign,
                socket: socket
            };

            game.host_player.socket.emit('found_game', { token: game.token });
            game.guest_player.socket.emit('found_game', { token: game.token });

            if (game.host_player.sign == 'cross') {
                // note the inversion
                game = this.madeTurn(game, 'guest');
            } else {
                game = this.madeTurn(game, 'host');
            }

            game.field = [[ null, null, null ], [ null, null, null ], [ null, null, null ]];

            this.games[i] = game;

            return;
        }
    }

    socket.emit('game_not_found')
};

GameServer.prototype.getGame = function(token) {
    var candidates = this.games.filter(function(game) {
        return (game.token == token);
    });

    if (candidates.length > 0) {
        return candidates[0];
    } else {
        return null;
    }
};

GameServer.prototype.setGame = function(token, game) {
    for (var i = 0; i < this.games.length; i++) {
        if (this.games[i].token == token) {
            this.games[i] = game;

            return true;
        }
    }

    return false;
};

GameServer.prototype.madeTurn = function(game, turned_player) {
    if (game.turn != null && game.turn != turned_player) {
        return game;
    }

    if (turned_player == 'guest') {
        game.turn = 'host';
        game.guest_player.socket.emit('waiting');
        game.host_player.socket.emit('my_turn');
    } else {
        game.turn = 'guest';
        game.guest_player.socket.emit('my_turn');
        game.host_player.socket.emit('waiting');
    }

    return game;
};

GameServer.prototype.handleMoveCommand = function(data, socket) {
    var game = this.getGame(data.token);

    if (game == null) {
        return;
    }

    if (game.host_player.socket == socket) {
        game = this.madeTurn(game, 'host');
    } else {
        game = this.madeTurn(game, 'guest');
    }

    this.setGame(data.token, game);
};

module.exports = GameServer;