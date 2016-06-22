var session_user_name;

function prompt_user_for_name(){
  $("<div class='blocker'> <label for='username_input'></label> <input id='username_input' /> </div>").appendTo('body');
}

$(document).ready(function() {
  // prompt_user_for_name();
  $("<audio id='chatAudio'><source src='sound/ping.mp3' type='audio/mpeg'></audio>").appendTo('body');
  $("#message_text").focus();

  $('#chat_log').bind('DOMSubtreeModified', function(){
    $('#chat_log').animate({
      scrollTop: $('#chat_log')[0].scrollHeight
    });
  });

});

var socket = io();

function parse_image(){

  if($('#message_text').val().substr($('#message_text').val().length - 3) === "jpg" || $('#message_text').val().substr($('#message_text').val().length - 3) === "gif"){
    return "<img class='image_message' src='" + $('#message_text').val() + "' />";
  }

  return $('#message_text').val();
}

$('form').submit(function() {
  socket.emit('chat message', $('#message_text').val());
  $('#chat_log').append($('<li>').html(parse_image() + "<span class='message_time'>" + new Date().toLocaleTimeString() + "</span>"));
  $('#message_text').val('');
  return false;
});

socket.on('disconnect', function(){
  alert('You have been disconnected from the server.');
});

socket.on('chat message', function(message) {
  $('#chat_log').append($('<li>').text(message));
  Push.create(message, {
    timeout: 5000
  });
  $('#chatAudio')[0].play();
});