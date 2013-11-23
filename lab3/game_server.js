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
        token: token,
        ended: false
    });

    socket.emit('waiting', { token: token });
};

GameServer.prototype.handleJoinCommand = function(data, socket) {
    for (var i = 0; i < this.games.length; i++) {
        var game = this.games[i];

        if (game.guest_player == null) {
            var host_sign = game.host_player.sign,
                guest_sign = (host_sign == 'cross') ? 'zero' : 'cross';

            game.guest_player = {
                sign: guest_sign,
                socket: socket
            };

            game.host_player.socket.emit('found_game', { token: game.token, sign: host_sign });
            game.guest_player.socket.emit('found_game', { token: game.token, sign: guest_sign });

            if (host_sign == 'cross') {
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

GameServer.prototype.isTurnValid = function(game, row, col) {
    return (game.field[row][col] == null);
};

GameServer.prototype.isMyTurn = function(game, turned_player) {
    return (game.turn == turned_player);
};

GameServer.prototype.isTurnWinning = function(game, turned_player, row, col) {
    var field = [[null, null, null], [null, null, null], [null, null, null]];

    for (var i = 0; i < 3; i++) {
        for (var t = 0; t < 3; t++) {
            field[i][t] = game.field[i][t];
        }
    }

    var player_sign = this.getPlayer(game, turned_player).sign;

    field[row][col] = player_sign;

    // check horizontal lines
    for (var i = 0; i < 3; i++) {
        var fl = true;

        for (var t = 0; t < 3; t++) {
            if (field[i][t] != player_sign) {
                fl = false;
                break;
            }
        }

        if (fl == true) {
            return true;
        }
    }

    // check vertical lines
    for (var i = 0; i < 3; i++) {
        var fl = true;

        for (var t = 0; t < 3; t++) {
            if (field[t][i] != player_sign) {
                fl = false;
                break;
            }
        }

        if (fl == true) {
            return true;
        }
    }

    // check main diagonal
    {
        var fl = true;

        for (var i = 0; i < 3; i++) {
            if (field[i][i] != player_sign) {
                fl = false;
                break;
            }
        }

        if (fl == true) {
            return true;
        }
    }

    // check additional diagonal
    {
        var fl = true;

        for (var i = 0; i < 3; i++) {
            if (field[2 - i][i] != player_sign) {
                fl = false;
                break;
            }
        }

        if (fl == true) {
            return true;
        }
    }

    return false;
};

GameServer.prototype.getPlayer = function(game, turned_player) {
    return game[turned_player + '_player'];
};

GameServer.prototype.madeTurn = function(game, turned_player, row, col) {

    if (typeof(row) != 'undefined' && typeof(col) != 'undefined') {
        var player_sign = this.getPlayer(game, turned_player).sign;

        game.field[row][col] = player_sign;

        game.host_player.socket.emit('set_field', { row: row, col: col, sign: player_sign });
        game.guest_player.socket.emit('set_field', { row: row, col: col, sign: player_sign });
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

    var turned_player = (game.host_player.socket == socket) ? 'host' : 'guest',
        player_sign = this.getPlayer(game, turned_player).sign,
        row = data.row,
        col = data.col;

    if (!this.isMyTurn(game, turned_player) || !this.isTurnValid(game, row, col)) {
        return;
    }

    game = this.madeTurn(game, turned_player, row, col);

    if (this.isTurnWinning(game, turned_player, row, col)) {
        var msg = player_sign + 'es won!';

        if (player_sign == 'cross') {
            msg = "Crosses won!"
        } else {
            msg = "Zeros won!"
        }

        game.host_player.socket.emit('win', { message: msg });
        game.guest_player.socket.emit('win', { message: msg });
        game.ended = true;
    }

    this.setGame(data.token, game);
};

module.exports = GameServer;