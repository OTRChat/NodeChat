var socket = io();
var chatInput = $('#message_text');
var chatLog = $('#chat_log');
var loginPage = $('.loginPage');
var chatPage = $('.chatPage');
var usernameInput = $('#usernameInput');
var currentInput = usernameInput.focus();
var username;
var connected = false;
var typing = false;
var typingTimerLength = 500 // ms
var lastTypingTime;

$(document).ready(function() {

  // Onload try and retrieve the persons username from localstorage
  var previousUsername = getUsernameFromStorage();

  // If the user has already visited the page before
  if(previousUsername !== null){
    
    // Hide the login page
    loginPage.hide();

    // Set the global username variable
    username = previousUsername;

    // Notify the server that someone has joined.
    userJoin(previousUsername);

    // Set the global variable that the user is connected
    connected = true;
  } else {
    // If the user did not have a username saved in localstorage then we hide the chatPage
    // This will show the login page, which gets the username from the user.
    chatPage.hide();
  }

  // Add an audio html tag. This is used to play the notification sound for the connected users.
  $("<audio id='chatAudio'><source src='sound/ping.mp3' type='audio/mpeg'></audio>").appendTo('body');
  
  // Focus the chat input box
  chatInput.focus();

  chatLog.bind('DOMSubtreeModified', function(){
    chatLog.animate({
      scrollTop: chatLog[0].scrollHeight
    });
  });
});

// Listen for the keydown event.
$(window).keydown(function(ev){
  // Focus the current input
  currentInput.focus();

  // If the key that was pushed was the enter key
  if(ev.which === 13){

    // Check if the user has a username i.e., they are logged in
    if(username){
      sendMessage();
      socket.emit('stop typing');
      typing = false;
    } else {
      // If the user was on the login screen then we set their username and log them in
      setUsername();
    }
  }
});

// Tell the server that we've had a user join
function userJoin(username){
  socket.emit('user join', username);
}

// Get the applications username from localstorage
function getUsernameFromStorage(){
  return localStorage.getItem('NodeChatUsername');
}

// The main function responsible for sending the chat messages
function sendMessage(){
  // Get the input of the chat message
  var messageText = chatInput.val();

  // If there is a message and we are connected to the server
  if(messageText && connected){
    // Clear down the chat input field
    chatInput.val('');

    // Call our function to add the message to the chat log.
    // We do this because we don't need to get our own message back from the user to display it.
    addChatMessage({
      username: username,
      message: messageText,
      messageClass: "from-me whiteText"
    });

    // Tell the server that we have sent a message.
    // This will trigger a broadcast to the other users
    socket.emit('new message', messageText);
  }
}

// Triggered when the user logs in
// When the user logs in, we add a message telling them "hello there X"
function greetUser(username){
  // Create a span with the greeting message
  var userGreeting = $('<span class="messageBody" />')
                      .text('Hello there ' + username + '!');
  
  // Create a container for the message text
  var greetingContainer = $('<li class="message" />')
                           .append(userGreeting);

  // Add the greeting to the chat log
  chatLog.append(greetingContainer);
}

// Called when the user logs in
// It sets the username global and opens the chat page for them
function setUsername(){

  // Get the username from the username input
  username = usernameInput.val();

  // If the username is not blank (we don't want blank usernames)
  if(username){
    // Hide the login page as the user has got a username now
    loginPage.hide();

    // Show the chat page
    chatPage.show();

    // Create a greeting message for the newly connected user
    greetUser(username);

    // Tell the server that we have got a new user
    socket.emit('add user', username);

    // Focus the chat input box
    currentInput = chatInput.focus();

    // Set the username that the user chose in localstorage
    // This is so that when we reload the page, we can get the username they had previously
    localStorage.setItem('NodeChatUsername', username);

    // Set the connected global
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

// Takes an input string and builds up some markup
// If the input is an image then we build up an image tag for it so it can be rendered directly on the page.
// Otherwise we just make it a span tag
function parseMessageText(inputString){

  // If the message was a link to an image
  if(imageFile(getFileType(inputString)) === true){
    // Build up the message as an image tag
    return imageLink(inputString);
  }
  
  // Return a span tag with the text of the message
  return $('<span class="messageBody" />').text(inputString);
}

// Adds a chat message to the chat log on the page based on the data passed to it
//  Parameters
//    @data - OBJECT - An object containing the message, who it was from and the css class we should apply to the message 
function addChatMessage(data){

  // Parse the message text. If the message is a link to an image then we do some special handling of it.
  var messageBody = parseMessageText(data.message);

  // Build up a span tag containing the current time of the message.
  var messageTime = $('<span class="messageTime" />')
                    .html(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));

  // Create a wrapper that will be added to the chat log
  // It will contain all the elements that we have built up.
  var messageContainer = $('<li class="message ' + data.messageClass + '" />')
                          .data('username', data.username)
                          .append(messageBody, messageTime);

  // Add the message to the chat log
  chatLog.append(messageContainer);
  
  // Scroll the user to the bottom of the page
  chatLog.animate({
      scrollTop: chatLog[0].scrollHeight
    });
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
    timeout: 5000,
    onClick: function () {
      window.focus();
      this.close();
    }
  });
  $('#chatAudio')[0].play();
}

// When the server has said we have logged in we set the connected variable to true
socket.on('login', function(data){
  connected = true;
});

// If the user has disconnected then we alert them
// This will happen if the server goes down
socket.on('disconnect', function(){
  alert('You have been disconnected from the server.');
});

// If the server has broadcast that there is a new message then we add it to our own chat log
// We also notify the client
// The messages received here will only be from other users. Our own messages are automatically added to the chat log
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