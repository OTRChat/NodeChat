import React, { Component } from "react";
import "./chatPage.css";
import * as Push from "push.js";

class ChatPage extends Component {
	greetUserName() {
		// Create a span with the greeting message
		const userGreeting = (
			<span className="messageBody">Hello there{this.state.username}!</span>
		); // Create a container for the message text
		const greetingContainer = <li className="message">{userGreeting}</li>;
		// Add the greeting to t    he chat log

		this.setState({ greeting: greetingContainer });
	}
}
