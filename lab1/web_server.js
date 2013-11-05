var net = require('net');

console.log('HELLO!');

var PORT = 80;

var server = net.createServer(function(conn) {
    console.log("server started");

    conn.on('end', function() {
        console.log("server is shutting down...");
    });

    content = '<html><htad><title>Hello, world!</title></head><body>Hello, I am nodejs webserver</body></html>';

    conn.write('Content-Type: text/html\nContent-Length: ' + content.length + '\n' + content + '\n\n');
    conn.pipe(conn);
});

server.listen(PORT, function() {
    console.log("Server is listening on port ", PORT);
});

server.on('error', function(err) {
    console.error(err);

    if (err.code == 'EADDRINUSE') {
        setTimeout(function() {
            server.close();
            server.listen(PORT);
        }, 1000);
    }
});