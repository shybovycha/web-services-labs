window.onload = function() {
    var messages = [];
    var socket = io.connect('http://localhost:80');

    socket.on('message', function (data) {
        if (data.message) {
            messages.push(data.message);

            var html = '';

            for(var i = 0; i < messages.length; i++) {
                html += messages[i] + '<br />';
            }

            document.querySelector('#content').innerHTML = html;
        } else {
            console.log("There is a problem:", data);
        }
    });

    document.querySelector('#send_form').addEventListener('submit', function(evt) {
        var messageField = document.querySelector('.message'),
            text = messageField.value;

        socket.emit('send', { message: text });

        messageField.value = '';

        evt.preventDefault();
    });
}