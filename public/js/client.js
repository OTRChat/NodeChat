$(document).ready(function() {
  $("<audio id='chatAudio'><source src='sound/ping.mp3' type='audio/mpeg'></audio>").appendTo('body');
});

var socket = io();

$('form').submit(function() {
  socket.emit('chat message', $('#message_text').val());
  $('#chat_log').append($('<li>').text($('#message_text').val()));
  $('#message_text').val('');
  return false;
});

socket.on('chat message', function(message) {
  $('#chat_log').append($('<li>').text(message));
  Push.create(message, {
    timeout: 5000
  });
  $('#chatAudio')[0].play();
});