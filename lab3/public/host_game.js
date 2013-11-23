window.onload = function() {
    window.connect_to_server();
    window.set_click_handler();

    socket.emit('create');
};