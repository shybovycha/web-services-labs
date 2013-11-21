window.connect_to_server = function() {
    window.socket = io.connect('http://localhost:80');

    socket.on('my_turn', function (data) {
        console.log('Wheeee! My turn!', data);
    });

    socket.on('waiting', function (data) {
        console.log("Boaaaap... I'll be waiting...", data);
    });

    socket.on('found_game', function (data) {
        console.log("Hurray! I am not alone!", data);

        window.game_token = data.token;
    });

    socket.on('game_not_found', function (data) {
        console.log("I am soooooo sad!...", data);
    });
};