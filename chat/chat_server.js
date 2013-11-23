var io = null,
    dbConnection = null;

var mysql = require('mysql');

var ChatServer = function(port, app) {
    io = require('socket.io').listen(app.listen(port));

    console.log("Listening on port " + port);

    this.users = [];
    this.logMessages = false;

    io.sockets.on('connection', this.onConnection.bind(this));

    dbConnection = mysql.createConnection({
        host : 'localhost',
        user : 'chat',
        password : 'abc123',
        database: 'chat'
    });

    dbConnection.connect();

    process.on('SIGTERM', function() {
        app.close();
    });

    app.on('close', function() {
        dbConnection.end();
    });
};

ChatServer.prototype.onConnection = function(socket) {
    var that = this;

    socket.on('send', function(data) {
        if (that.logMessages == true) {
            console.log('<<< ', data);
        }

        var messageType = that.getMessageType(data);

        if (messageType == 'join') {
            that.handleJoinCommand(data, socket);
        } else if (messageType == 'list') {
            that.handleListCommand(data, socket);
        } else if (messageType == 'private') {
            that.handlePrivateMessage(data, socket);
        } else {
            that.handleBroadcastMessage(data, socket);
        }
    });
};

ChatServer.prototype.storeMessage = function(message, from, to) {
    var binding = [
        new Date(),
        from || 'server',
        to || 'all',
        message
    ];

    dbConnection.query('INSERT INTO messages (timestamp, sender, receiver, message) VALUES (?, ?, ?, ?)', binding, function(err) {
        if (err)
            throw err;
    });
};

ChatServer.prototype.getMessageType = function(data) {
    if (typeof(data.message) === 'undefined') {
        return false;
    }

    if (this.getRegexp('join').test(data.message)) {
        return 'join';
    }

    if (this.getRegexp('list').test(data.message)) {
        return 'list';
    }

    if (this.getRegexp('private').test(data.message)) {
        return 'private';
    } else {
        return 'broadcast';
    }
};

ChatServer.prototype.getRegexp = function(name) {
    var regexps = {
        join: /^\/join\s+([\w]+)/i,
        private: /^@([\w]+)\s+(.+)/,
        list: /^\/list/i
    };

    if (typeof(regexps[name]) === 'undefined') {
        return null;
    } else {
        return regexps[name];
    }
};

ChatServer.prototype.handleJoinCommand = function(data, socket) {
    var name = data.message.replace(this.getRegexp('join'), '$1');

    var candidates = this.users.filter(function(user) {
        return (user.name == name);
    });

    if (candidates.length < 1) {
        this.users.push({
            socket: socket,
            name: name
        });

        this.storeMessage(name + ' joined', 'server', 'all');

        this.handleBroadcastMessage({ 'message': 'Welcome new user, ' + name + '!' })
    } else {
        socket.emit('message', { 'message': 'This username is already taken!', 'sender': 'server' })
    }
};

ChatServer.prototype.getSenderName = function(socket) {
    var candidates = this.users.filter(function(user) {
        return (user.socket == socket);
    });

    if (candidates.length > 0) {
        return candidates[0].name;
    } else {
        return 'server';
    }
};

ChatServer.prototype.handleListCommand = function(data, socket) {
    var names = this.users.map(function(user) {
        return user.name;
    });

    socket.emit('message', { 'message': 'Users online: <br />' + names, 'sender': 'server' })
};

ChatServer.prototype.handleBroadcastMessage = function(data, socket) {
    var message = data.message,
        senderName = this.getSenderName(socket);

    this.storeMessage(message, senderName, 'all');

    this.users.forEach(function(user) {
        user.socket.emit('message', { 'message': message, 'sender': senderName });
    });
};

ChatServer.prototype.handlePrivateMessage = function(data, socket) {
    var message = data.message.replace(this.getRegexp('private'), '$2'),
        recipientName = data.message.replace(this.getRegexp('private'), '$1'),
        senderName = this.getSenderName(socket);

    this.storeMessage(message, senderName, recipientName);

    this.users.forEach(function(user) {
        if (user.name == recipientName) {
            user.socket.emit('message', { 'message': message, 'sender': '[' + senderName + ']' });
            socket.emit('message', { 'message': message, 'sender': '[' + senderName + ']' });
            return false;
        }

        return true;
    });
};

module.exports = ChatServer;