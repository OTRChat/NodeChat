var socket = io();
var $chatInput = $('#message_text');
var $chatLog = $('#chat_log');
var $loginPage = $('.loginPage');
var $chatPage = $('.chatPage');
var $usernameInput = $('#usernameInput');
var username;
var connected = false;
var typing = false;
var typingTimerLength = 500 // ms
var lastTypingTime;

$(document).ready(function() {
  $("<audio id='chatAudio'><source src='sound/ping.mp3' type='audio/mpeg'></audio>").appendTo('body');
  $chatInput.focus();

  $chatLog.bind('DOMSubtreeModified', function(){
    $chatLog.animate({
      scrollTop: $chatLog[0].scrollHeight
    });
  });
});

$(window).keydown(function(ev){
  if(ev.which === 13){
    if(username){
      sendMessage();
      socket.emit('stop typing');
      typing = false;
    } else {
      setUsername();
    }
  }
});

function sendMessage(){
  var messageText = $chatInput.val();

  if(messageText && connected){
    $chatInput.val('');

    addChatMessage({
      username: username,
      message: messageText
    });

    socket.emit('new message', messageText);
  }
}

function setUsername(){

  username = $usernameInput.val();

  if(username){
    $loginPage.hide();
    $chatPage.show();

    socket.emit('add user', username);

    connected = true;
  }
}

function parseMessageText(inputString){
  // TODO: Abstract this to another method to detect if it only contains an image url.
  if(inputString.substr(inputString.length - 3) === "jpg" || inputString.substr(inputString.length - 3) === "gif"){
    return "<img class='image_message' src='" + inputString + "' />";
  }

  return inputString;
}

function addChatMessage(data){
  var $usernameSpan = $('<span class="username" />')
                      .text(data.username);

  var $messageBody = $('<span class="messageBody" />')
                    .text(parseMessageText(data.message));

  var $messageTime = $('<span class="messageTime" />')
                    .html(new Date().toLocaleTimeString());

  var $messageContainer = $('<li class="message" />')
                          .data('username', data.username)
                          .append($usernameSpan, $messageBody, $messageTime);

  $chatLog.append($messageContainer);
  $chatLog[0].scrollTop = $chatLog[0].scrollHeight;
}

function updateTyping(){
  if(connected){
    if(!typing){
      typing = false;
      socket.emit('typing');
    }
  }
  lastTypingTime = new Date().getTime();

  setTimeout(function(){
    var typingTimer = new Date().getTime();
    var timeDiff = typingTimer - lastTypingTime;

    if(timeDiff >= typingTimerLength && typing){
      socket.emit('stop typing');
      typing = false;
    }
  }, typingTimerLength);
}

function addChatTyping(data){
  data.typing = true;
  data.message = 'is typing...';
  addChatMessage(data)
}

function getTypingMessages(data){
  return $('.typingMessages').filter(function(x){
    return $(this).data('username') === data.username;
  });
}

function removeChatTyping(data){
  getTypingMessages(data).remove();
}

function notifyUser(){
  Push.create(message, {
    timeout: 5000
  });
  $('#chatAudio')[0].play();
}

socket.on('login', function(data){
  connected = true;
});

socket.on('disconnect', function(){
  alert('You have been disconnected from the server.');
});

socket.on('new message', function(message) {
  addChatMessage(message);
  notifyUser();
});

socket.on('typing', function(data){
  addChatTyping(data);
});

socket.on('stop typing', function(data){
  removeChatTyping(data);
});