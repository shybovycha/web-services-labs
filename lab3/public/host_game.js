window.onload = function() {
    window.connect_to_server();

    socket.emit('create');
};