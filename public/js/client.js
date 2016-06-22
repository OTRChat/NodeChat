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

function parse_image(input_string){

  if(input_string.substr(input_string.length - 3) === "jpg" || input_string.substr(input_string.length - 3) === "gif"){
    return "<img class='image_message' src='" + input_string + "' />";
  }

  return input_string;
}

$('form').submit(function() {
  socket.emit('chat message', $('#message_text').val());
  $('#chat_log').append($('<li>').html(parse_image($('#message_text').val()) + "<span class='message_time'>" + new Date().toLocaleTimeString() + "</span>"));
  $('#message_text').val('');
  return false;
});

socket.on('disconnect', function(){
  alert('You have been disconnected from the server.');
});

socket.on('chat message', function(message) {
  $('#chat_log').append($('<li>').html(parse_image(message) + "<span class='message_time'>" + new Date().toLocaleTimeString() + "</span>"));
  Push.create(message, {
    timeout: 5000
  });
  $('#chatAudio')[0].play();
});