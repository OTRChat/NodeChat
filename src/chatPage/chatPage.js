import React, { Component } from 'react';
import './chatPage.css';
import * as Push from "push.js";
import mp3_file from '../app/assets/sound/ping.mp3';
import userImg from './user.png';
import chatIcon from './chatIconPushNotification.png';
class ChatPage extends Component {

    constructor(props) {
        super(props);
        this.state = {
            socket: props.socket,
            chatInput: '',
            chatLog: [],
            greeting: '',
            connected: props.connected,
            username: props.username,
            userIsTyping: [],
            previousUser: props.previousUser
        };
        this.setChatInput = this.setChatInput.bind(this);
        this.enterKeyPress = this.enterKeyPress.bind(this);
    }
    componentDidMount() {
        if (this.state.connected) {
            // Create a greeting message for the newly connected user
            if(!this.state.previousUser){
                this.greetUser();
            }
            this.state.socket.on('new message', (message) => {
                this.addChatMessage(message);
                if(this.state.username !== message.username){
                    this.notifyUser(message);
                }
            });
            this.state.socket.on('typing', (user) => {
                if(this.state.username !== user.username){
                    if(!this.state.userIsTyping.find(function(users){
                        return users == user.username;
                    })){
                        this.setState({ userIsTyping: [...this.state.userIsTyping, user.username] });
                    }
                }
            });
            this.state.socket.on('stop typing', (user) => {
                if(this.state.username !== user.username){
                    this.setState({userIsTyping: this.state.userIsTyping.filter(function(users) { 
                        return users !== user.username;
                    })});
                }
            });
        }

    }
    greetUser() {
        // Create a span with the greeting message
        var userGreeting = <span className="messageBody">Hello there {this.state.username}!</span>;

        // Create a container for the message text
        var greetingContainer = <li className="message">{userGreeting}</li>;

        // Add the greeting to the chat log
        this.setState({ greeting: greetingContainer });
    }

    enterKeyPress(e) {
        if (e.keyCode == 13) {
            this.sendMessage();
            this.setState({ chatInput: '' });
        }
    }
    setChatInput(event) {
        if(event.target.value !== ""){
            this.state.socket.emit('typing', this.state.username);
        } else if(event.target.value === ""){
            this.state.socket.emit('stop typing', this.state.username);
        }
        this.setState({ chatInput: event.target.value });
    }

    sendMessage() {
        // Get the input of the chat message
        var messageText = this.state.chatInput;

        // If there is a message and we are connected to the server
        if (messageText && this.state.connected) {

            // Call our function to add the message to the chat log.
            // We do this because we don't need to get our own message back from the user to display it.
            this.addChatMessage({
                username: this.state.username,
                message: messageText,
                messageClass: "from-me whiteText"
            });

            // Tell the server that we have sent a message.
            // This will trigger a broadcast to the other users
            this.state.socket.emit('new message', messageText);
        }
    }

    addChatMessage(data) {
        // Parse the message text. If the message is a link to an image then we do some special handling of it.
        var messageBody = this.parseMessageText(data.message);

        // Builds the current time of the message.
        var date = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Add the message to the chat log
        var messageContainer = {
            messageClass: data.messageClass,
            UserName: data.username,
            messageBody: messageBody,
            messageTime: date,
            fromThemUserName: '',
            messageSenderClass:''
        }
        // Add User name to message if from-them
        if(data.messageClass !== "from-me whiteText"){
            messageContainer.fromThemUserName = <span className="from-them-userName">{data.username}</span>;
            messageContainer.messageSenderClass = "from-them-userPic";
        } else {
            messageContainer.messageSenderClass = "from-me-userPic";
            messageContainer.UserName = "Me";
        }

        this.setState({ chatLog: [...this.state.chatLog, messageContainer] },()=>{
            this.scrollToBottom();
        });
    }

    parseMessageText(inputString) {

        // If the message was a link to an image
        if (this.imageFile(this.getFileType(inputString)) === true) {
            // Build up the message as an image tag
            return this.imageLink(inputString);
        }

        // Return a span tag with the text of the message
        return <span className="messageBody">{inputString}</span>;
    }

    imageFile(filetype) {
        // Create an object that stores the image file formats
        var imageFormats = {
            "jpg": 0,
            "gif": 0,
            "jpeg": 0
        };

        // Iterate through the list of image file formats
        for (var files in imageFormats) {
            // Check if the file type passed to the method is in our list of approved image file formats
            if (imageFormats.hasOwnProperty(filetype) === true) {
                return true;
            }
        }

        // If it's not an approved file format then return false.
        return false;
    }

    getFileType(inputString) {
        return inputString.split(".").pop();
    }

    imageLink(inputString) {

        // Trim the input string
        inputString = inputString.trim();

        // Get the file type from the input
        var filetype = this.getFileType(inputString);

        // Build up an image tag and return it
        // Set the source of the img tag
        if (inputString.substring(0, 4) === "http" && this.imageFile(filetype) === true) {
            return <img className='image_message' src={" " + inputString + " "} />;
        }
    }

    scrollToBottom() {
        this.el.scrollIntoView({ behavior: 'smooth', inline: "nearest"});
    }

    notifyUser(message){
  
        // Create a push notification
        Push.create(message.username, {
          body: message.message,
          timeout: 5000,
          icon: chatIcon,
          onClick: function () {
            window.focus();
            this.close();
          }
        });
        this.Sound.play();
    }

    render() {
        return (
            <div>
               <audio src={mp3_file} ref={Sound => { this.Sound = Sound; }}/>
                <ul className="pages">
                    <li className="chatPage page">
                        <ul id="chat_log">
                            {this.state.greeting /*To Do make only show at first login*/}
                            {this.state.chatLog.map((message, index) => {
                                return (<li key={index}  ref={el => { this.el = el; }}
                                    className={"message " + message.messageClass}>
                                    <div className={message.messageSenderClass}>
                                        <img  className="userNamePic" src={userImg}></img>
                                        <p className="userName">{message.UserName}</p>
                                    </div>
                                    <div>
                                        {message.messageBody}
                                        <span className="messageTime">
                                            {message.messageTime}
                                        </span>
                                    </div>
                                </li>);
                            })}
                        </ul>
                        <div className="isTyping">
                            <ul>{this.state.userIsTyping.map((users, index) => {
                                    return (<li key={index}>
                                        <span className="typing">
                                            {users} is typing...&nbsp;
                                        </span>
                                    </li>);
                                })}
                            </ul>
                        </div>
                        <div className="inputContainer">
                            <input id="message_text" placeholder="Send a message"
                                value={this.state.chatInput}
                                onChange={this.setChatInput}
                                autoFocus
                                onKeyDown={this.enterKeyPress}
                            />
                        </div>
                    </li>
                </ul>
            </div>
        );
    }
}

export default ChatPage;