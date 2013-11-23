window.connect_to_server = function() {
    window.socket = io.connect('http://localhost:80');

    socket.on('my_turn', function (data) {
        // console.log('Wheeee! My turn!', data);
        window.set_message("It's my turn!");
    });

    socket.on('waiting', function (data) {
        // console.log("Boaaaap... I'll be waiting...", data);
        window.set_message("Stay tuned...");
    });

    socket.on('found_game', function (data) {
        // console.log("Hurray! I am not alone!", data);
        window.set_message("I'll be playing as " + data.sign);

        window.game_token = data.token;
    });

    socket.on('game_not_found', function (data) {
        // console.log("I am soooooo sad!...", data);
        window.set_message("Sorry for that, but no games were found... =(");
    });

    socket.on('set_field', function (data) {
        var cell = document.querySelector('.field').
            querySelector('tr:nth-child(' + (parseInt(data.row) + 1) + ')').
            querySelector('td:nth-child(' + (parseInt(data.col) + 1) + ')');

        cell.innerHTML = data.sign;

        console.log("Move:", data.row, data.col, data.sign);
    });

    socket.on('win', function(data) {
        var cells = document.querySelectorAll('.field tr td');

        for (var i = 0; i < cells.length; i++) {
            cells[i].removeEventListener('click');
        }

        window.set_message(data.message);
    });
};

window.set_click_handler = function() {
    var cells = document.querySelectorAll('.field tr td');

    for (var i = 0; i < cells.length; i++) {
        cells[i].addEventListener('click', function(evt) {
            for (var row = 0; row < 3; row++) {
                for (var col = 0; col < 3; col++) {
                    var cell = document.querySelector('.field').
                                querySelector('tr:nth-child(' + (row + 1) + ')').
                                querySelector('td:nth-child(' + (col + 1) + ')');

                    if (cell == this) {
                        window.socket.emit('move', { token: window.game_token, row: row, col: col });
                        return;
                    }
                }
            }
        });
    }
};

window.set_message = function(message) {
    document.querySelector('.message').innerHTML = message;
};