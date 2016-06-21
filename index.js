var express = require('express');
var app = express();
var http = require('http').Server(app);
var port = 9876;
var path = require('path');
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  console.log('A user has connected: ' + socket.id);

  socket.on('chat message', function(message){
    io.emit('chat message', message)
  });

  socket.on('disconnect', function(){
    console.log(socket.name + ' has disconnected.' + socket.id);
  });


});

http.listen(port, function(){
  console.log('listening on *:' + port);
});