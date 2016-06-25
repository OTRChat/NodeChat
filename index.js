var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 9876;
var path = require('path');
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname + 'public/index.html');
});

io.on('connection', function(socket){
  console.log('A user has connected: ' + socket.id);

  socket.on('new message', function(message){
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: message
    });
  });

  socket.on('disconnect', function(){
    console.log('User: ' + socket.username + ' has disconnected.' + socket.id);
  });

  socket.on('typing', function(){
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  socket.on('stop typing', function(){
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  socket.on('add user', function(username){
    socket.username = username;
  });

  socket.on('user join', function(username){
    socket.username = username;
    socket.broadcast.emit('user join', { username: socket.username });
  })
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});