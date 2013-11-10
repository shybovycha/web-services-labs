var http = require("http"),
    fs = require("fs-extra"),
    path = require("path"),
    mime = require("mime");

http.createServer(function(request, response) {
    console.log("Requested " + request.url);

    var url = request.url.replace(/^\/+/, '');
    var found = false;

    var candidates = [
        url,
        path.join(url, 'index.html'),
        path.join(url, 'index.htm'),
        path.join(url, 'index.txt'),
        path.join(url, 'readme.txt'),
        path.join(url, 'README.txt'),
        path.join(url, 'README.md'),
        path.join(url, 'README'),
        path.join(url, 'readme')
    ];

    for (var i = 0; i < candidates.length; i++) {
        var file_path = candidates[i];

        console.log("trying " + file_path + "...");

        if (!fs.existsSync(file_path)) {
            console.log("Naaaah... One does not exist...");
            continue;
        }

        var stats = fs.lstatSync(file_path);

        if (!stats.isDirectory() && stats.isFile()) {
            console.log("Yep! That's it!");

            found = true;

            var mime_type = mime.lookup(file_path);

            fs.readFile(file_path, 'utf8', function(err, data) {
                if (err) {
                    response.writeHead(500, { "Content-Type": "text/html" });
                    response.write("<html><head><title>Whoops...</title></head><body><h1>Something went wrong while trying to process your request...</h1></body></html>");
                    response.end();

                    console.error(err);
                } else {
                    response.writeHead(200, { "Content-Type": mime_type });
                    response.write(data);
                    response.end();
                }
            });

            break;
        } else {
            console.log("Naaaah... One is not a file...");
        }
    }

    if (!found) {
        response.writeHead(404, { "Content-Type": "text/html" });
        response.write("<html><head><title>Whoops...</title></head><body><h1>Sorry, but i cant find that... =(</h1></body></html>");
        response.end();
    }
}).listen(80);

console.log('Server is listening on 80th port');