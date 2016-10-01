var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = process.env.PORT || 9876;
var path = require('path');
var io = require('socket.io')(http);
var shortid = require('shortid');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/src/index.html');
});

io.on('connection', function(socket){

  // When a new user connects then we output a log
  console.log('A user has connected: ' + socket.id);

  // When the server receives a new message to send we broadcast it to the other users on the server
  socket.on('new message', function(message){
    // Broadcast will send to all users except the client that sent the message
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: message,
      messageClass: "from-them blackText"
    });
  });
  
  // When a user disconnects then log that to the server
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
  
  // When a new user is registered (they make a username), set their username on the server.
  socket.on('add user', function(username){
    socket.username = username;
  });
  
  // When a new user joins broadcast it to the other users on the server
  // Also set the servers username.
  socket.on('user join', function(username){
    socket.username = username;
    socket.broadcast.emit('user join', { username: socket.username });
  })
});

// Create the server - log the port number we are using
http.listen(port, function(){
  console.log('listening on *:' + port);
});