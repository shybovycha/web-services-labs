window.onload = function() {
    var socket = io.connect('http://localhost:80');
    var content_elt = document.querySelector('#content');

    socket.on('message', function (data) {
        if (data.message) {
            var html = '<span class="server-msg">' + data.sender + ':' + data.message + '</span><br />';

            content_elt.innerHTML = content_elt.innerHTML + html;
        } else if (data.private_message) {
            var html = '<span class="private-msg">' + data.sender + ':' + data.message + '</span><br />';

            content_elt.innerHTML = content_elt.innerHTML + html;
        } else if (data.error) {
            var html = '<span class="server-err">' + data.error + '</span><br />';

            content_elt.innerHTML = content_elt.innerHTML + html;
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
};

/*window.onload = function() {
    var loginForm = document.querySelector('#login_form');

    loginForm.addEventListener('submit', function(evt) {
        var name = document.querySelector('.username').value;
        connect(name);
        evt.preventDefault();
    });
}*/