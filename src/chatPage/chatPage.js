import React, { Component } from "react";
import "./chatPage.css";
import * as Push from "push.js";
import mp3_file from "../app/assets/sound/ping.mp3";
import userImg from "./user.png";
import chatIcon from "./chatIconPushNotification.png";
import LoginPage from "../loginPage/loginPage.js";

class ChatPage extends Component {
	constructor(props) {
		super(props);
		this.state = {
			socket: props.socket,
			chatInput: "",
			chatLog: [],
			greeting: "",
			connected: props.connected,
			username: props.username,
			avatar: userImg,
			userIsTyping: [],
			previousUser: props.previousUser,
			logout: false,
		};
		this.setChatInput = this.setChatInput.bind(this);
		this.enterKeyPress = this.enterKeyPress.bind(this);
		this.Logout = this.Logout.bind(this);
		this.Avatar = this.Avatar.bind(this);
	}

	componentDidMount() {
		if (this.state.connected) {
			// Create a greeting message for the newly connected user
			if (!this.state.previousUser) {
				this.greetUser();
			}
			// setup default avatar
			this.setState({ avatar: userImg });
			this.state.socket.emit("add avatar", this.state.avatar);

			this.state.socket.on("new message", message => {
				this.addChatMessage(message);
				if (this.state.username !== message.username) {
					this.notifyUser(message);
				}
			});
			this.state.socket.on("typing", user => {
				if (this.state.username !== user.username) {
					if (!this.state.userIsTyping.find(users => users === user.username)) {
						this.setState({
							userIsTyping: [...this.state.userIsTyping, user.username],
						});
					}
				}
			});
			this.state.socket.on("stop typing", user => {
				if (this.state.username !== user.username) {
					this.setState({
						userIsTyping: this.state.userIsTyping.filter(
							users => users !== user.username
						),
					});
				}
			});
			this.state.socket.on("user join", username => {
				this.addSystemMessage(`User ${username} joined the room.`);
			});
			this.state.socket.on("user disconnected", username => {
				this.addSystemMessage(`User ${username.username} has left the room`);
			});
		}
	}

	greetUser() {
		// Create a span with the greeting message
		const userGreeting = (
			<span className="messageBody">Hello there {this.state.username}!</span>
		);

		// Create a container for the message text
		const greetingContainer = <li className="message">{userGreeting}</li>;

		// Add the greeting to the chat log
		this.setState({ greeting: greetingContainer });
	}

	enterKeyPress(e) {
		if (e.keyCode === 13) {
			this.sendMessage();
			this.setState({ chatInput: "" });
			this.state.socket.emit("stop typing", this.state.username);
		}
	}

	setChatInput(event) {
		if (event.target.value !== "") {
			this.state.socket.emit("typing", this.state.username);
		} else {
			this.state.socket.emit("stop typing", this.state.username);
		}
		this.setState({ chatInput: event.target.value });
	}

	sendMessage() {
		// Get the input of the chat message
		const messageText = this.state.chatInput;

		// If there is a message and we are connected to the server
		if (messageText && this.state.connected) {
			// Call our function to add the message to the chat log.
			// We do this because we don't need to get our own message back from the user to display it.
			this.addChatMessage({
				username: this.state.username,
				message: messageText,
				messageClass: "from-me whiteText",
			});

			// Tell the server that we have sent a message.
			// This will trigger a broadcast to the other users
			this.state.socket.emit("new message", messageText);
		}
	}

	addChatMessage(data) {
		const date = new Date().toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
		let messageSenderClass = "";
		let UserName = data.username;
		const messageBody = this.parseMessageText(data.message);
		let avatar = data.avatar;

		if (data.messageClass !== "from-me whiteText") {
			messageSenderClass = "from-them-userPic";
		} else {
			messageSenderClass = "from-me-userPic";
			UserName = this.state.username;
			avatar = this.state.avatar;
		}

		const element = (
			<div>
				<div className={messageSenderClass}>
					<img className="userNamePic" src={avatar} />
					<p className="userName">{UserName}</p>
				</div>
				<div>
					{messageBody}
					<span className="messageTime">{date}</span>
				</div>
			</div>
		);

		const container = {
			class: data.messageClass,
			element,
		};
		this.setState({ chatLog: [...this.state.chatLog, container] }, () => {
			this.scrollToBottom();
		});
	}

	addSystemMessage(message) {
		const date = new Date().toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
		const element = (
			<div>
				{message} ({date})
			</div>
		);

		const container = {
			class: "systemLog",
			element,
		};
		this.setState({ chatLog: [...this.state.chatLog, container] }, () => {
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
		const imageFormats = {
			jpg: 0,
			gif: 0,
			jpeg: 0,
		};

		// Iterate through the list of image file formats
		for (const files in imageFormats) {
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
		const filetype = this.getFileType(inputString);

		// Build up an image tag and return it
		// Set the source of the img tag
		if (
			inputString.substring(0, 4) === "http" &&
			this.imageFile(filetype) === true
		) {
			return (
				<img
					className="image_message"
					src={` ${inputString} `}
					alt="image_message"
				/>
			);
		}
	}

	scrollToBottom() {
		this.el.scrollIntoView({ behavior: "smooth", inline: "nearest" });
	}

	notifyUser(message) {
		// Create a push notification
		Push.create(message.username, {
			body: message.message,
			timeout: 5000,
			icon: chatIcon,
			onClick() {
				window.focus();
				this.close();
			},
		});
		this.Sound.play();
	}

	Logout() {
		localStorage.clear();
		this.setState({ logout: true });
	}

	Avatar(event) {
		this.setState(
			{
				avatar: URL.createObjectURL(event.target.files[0]),
			},
			() => {
				this.state.socket.emit("add avatar", this.state.avatar);
			}
		);
	}

	displayChat() {
		return (
			<div>
				<audio
					src={mp3_file}
					ref={Sound => {
						this.Sound = Sound;
					}}
				/>
				<div className="topnav">
					<div className="topnav-right">
						<input
							type="file"
							id="avatarFile"
							name="avatarFile"
							onChange={this.Avatar}
						/>
						<input type="button" value="Logout" onClick={this.Logout} />
					</div>
				</div>
				<ul className="pages">
					<li className="chatPage page">
						<ul id="chat_log">
							{this.state.greeting /* To Do make only show at first login */}
							{this.state.chatLog.map((message, index) => (
								<li
									key={index}
									ref={el => {
										this.el = el;
									}}
									className={`message ${message.class}`}>
									{message.element}
								</li>
							))}
						</ul>
						<div className="inputContainer">
							<div className="isTyping">
								<ul>
									{this.state.userIsTyping.map((users, index) => (
										<li key={index}>
											<span className="typing">{users} is typing...&nbsp;</span>
										</li>
									))}
								</ul>
							</div>
							<div className="chatBox">
								<input
									id="message_text"
									placeholder="Send a message"
									value={this.state.chatInput}
									onChange={this.setChatInput}
									autoFocus
									onKeyDown={this.enterKeyPress}
								/>
							</div>
						</div>
					</li>
				</ul>
			</div>
		);
	}

	render() {
		let currentPage;
		if (this.state.logout) {
			currentPage = <LoginPage />;
		} else {
			currentPage = this.displayChat();
		}
		return <div>{currentPage}</div>;
	}
}

export default ChatPage;
