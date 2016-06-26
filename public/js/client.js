var socket = io();
var $chatInput = $('#message_text');
var $chatLog = $('#chat_log');
var $loginPage = $('.loginPage');
var $chatPage = $('.chatPage');
var $usernameInput = $('#usernameInput');
var $currentInput = $usernameInput.focus();
var username;
var connected = false;
var typing = false;
var typingTimerLength = 500 // ms
var lastTypingTime;

$(document).ready(function() {
  var previousUsername = getUsernameFromStorage();

  if(previousUsername !== null){
    $loginPage.hide();
    username = previousUsername;
    userJoin(previousUsername);
    connected = true;
  } else {
    $chatPage.hide();
  }
  $("<audio id='chatAudio'><source src='sound/ping.mp3' type='audio/mpeg'></audio>").appendTo('body');
  $chatInput.focus();

  $chatLog.bind('DOMSubtreeModified', function(){
    $chatLog.animate({
      scrollTop: $chatLog[0].scrollHeight
    });
  });
});

$(window).keydown(function(ev){
  $currentInput.focus();
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

function userJoin(username){
  socket.emit('user join', username);
}

function getUsernameFromStorage(){
  return localStorage.getItem('NodeChatUsername');
}

function sendMessage(){
  var messageText = $chatInput.val();

  if(messageText && connected){
    $chatInput.val('');

    addChatMessage({
      username: username,
      message: messageText,
      messageClass: "from-me"
    });

    socket.emit('new message', messageText);
  }
}

function greetUser(username){
  var $userGreeting = $('<span class="messageBody" />')
                      .text('Hello there ' + username + '!');

  var $greetingContainer = $('<li class="message" />')
                           .append($userGreeting);

  $chatLog.append($greetingContainer);
}

function setUsername(){

  username = $usernameInput.val();

  if(username){
    $loginPage.hide();
    $chatPage.show();
    greetUser(username);
    socket.emit('add user', username);
    $currentInput = $chatInput.focus();
    localStorage.setItem('NodeChatUsername', username);
    connected = true;
  }
}

function getFileType(inputString){
  return inputString.split(".").pop();
}

function imageFile(filetype){
  var imageFormats = {
    "jpg"  : 0,
    "gif"  : 0,
    "jpeg" : 0
  };

  for(var files in imageFormats){
    if(imageFormats.hasOwnProperty(filetype) === true){
      return true;
    }
  }

  return false;
}

function imageLink(inputString){
  inputString = inputString.trim();

  var filetype = getFileType(inputString);

  if(inputString.substring(0, 4) === "http" && imageFile(filetype) === true){
    return "<img class='image_message' src='" + inputString + "' />";
  }
}

function parseMessageText(inputString){

  if(imageFile(getFileType(inputString)) === true){
    return imageLink(inputString);
  }

  return $('<span class="messageBody" />').text(inputString);
}

function addChatMessage(data){

  var $messageBody = parseMessageText(data.message);

  var $messageTime = $('<span class="messageTime" />')
                    .html(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  var $messageContainer = $('<li class="message ' + data.messageClass + '" />')
                          .data('username', data.username)
                          .append($messageBody, $messageTime);

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

function notifyUser(message){
  Push.create(message.username, {
    body: message.message,
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
  notifyUser(message);
});

socket.on('typing', function(data){
  addChatTyping(data);
});

socket.on('stop typing', function(data){
  removeChatTyping(data);
});

socket.on('user join', function(data){

});