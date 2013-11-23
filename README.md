# web-services-labs

## Brief overview

This repo contains three projects for the corresponding subject at my university.

Projects are written using NodeJS and some of NPM modules.

## WebServer

This one serves its own folder. That is, if you put any of your HTML or any other files into the project' root and 
run `node server.js`, you shall be able to see those files at your browser at `http://localhost/your_file.html` or so.

## Chat

This project is a multi-user chat room. Use these commands:

* `/join <NAME>` - join the chatting room as a `<NAME>`
* `/list` - list all the chat members
* `@<NAME> <MESSAGE>` - send private message, `<MESSAGE>`, to user `<NAME>`

## TicTacToe

Famous game. Has almost no design. Yet, it just works. One allows users to either create a game and start playing
as a random sign - *cross* or *zero*; or join any game having no opponents, just hoster. Players do not see their signs
until game starts.
