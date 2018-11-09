import React, { Component } from 'react';
import './loginPage.css';
import ChatPage from '../chatPage/chatPage.js';
import io from 'socket.io-client';
import { Socket } from 'net';

class LoginPage extends Component {

    constructor(props) {
        super(props);

        this.socket = io('http://localhost:9876');

        this.state = {
            currentInput: '',
            username: '',
            usernameInput: '',
            isLoggedIn: false,
            previousUser: false,
            socket: '',
            connected: false
        };
        this.setUsernameInput = this.setUsernameInput.bind(this);
        this.enterKeyPress = this.enterKeyPress.bind(this);
    }
    enterKeyPress(e) {
        if (e.keyCode === 13) {
            this.setUsername();
            this.setState({ setUsernameInput: '' });
        }
    }
    setUsernameInput(event) {
        this.setState({ usernameInput: event.target.value });
    }
    componentDidMount() {
        this.checkIfPreviousUser();
    }

    // Called when the user logs in
    // It sets the username global and opens the chat page for them
    setUsername() {
        // If the username is not blank (we don't want blank usernames)
        if (this.state.usernameInput) {

            // Get the username from the username input
            // callback forces username update
            this.setState({ username: this.state.usernameInput }, function () {
                
                // Hide the login page as the user has got a username now
                this.setState({ isLoggedIn: true });

                // Tell the server that we have got a new user
                this.socket.emit('user join', this.state.username);

                // Set the username that the user chose in localstorage
                // This is so that when we reload the page, we can get the username they had previously
                localStorage.setItem('NodeChatUsername', this.state.username);

                // Set the connected global
                this.setState({ connected: true });
            });
        }
    }

    checkIfPreviousUser() {
        var previousUsername = localStorage.getItem('NodeChatUsername');

        if (previousUsername !== null) {        
            this.setState(
                {
                // Hide the login page 
                isLoggedIn: true,
                // Set the global username variable
                username: previousUsername,
                // Set the global variable that the user is connected
                connected: true,
                previousUser: true
                },
                () => {
                    this.userJoin();
                }
            );
        }
        // If the user did not have a username saved in localstorage then the chatPage is hidden
        // login page is shown, which ask for a username from the user.
    }

    // Tell the server that we've had a user join
    userJoin() {
        this.socket.emit('user join', this.state.username);
    }

    displayLogin() {
        return (
            <div>
                <ul className="pages">
                    <li className="loginPage page">
                        <div className="loginForm">
                            <h5 className="title">Please enter a Nickname</h5>
                            <input id="usernameInput" maxLength="20"
                                value={this.state.usernameInput}
                                onChange={this.setUsernameInput}
                                autoFocus
                                onKeyDown={this.enterKeyPress}
                            />
                        </div>
                    </li>
                </ul>
            </div>
        );
    }
    render() {
        let currentPage;
        if (this.state.isLoggedIn) {
            currentPage = <ChatPage socket={this.socket}
                connected={this.state.connected}
                username={this.state.username}
                previousUser={this.state.previousUser}
            />;
        } else {
            currentPage = this.displayLogin();
        }
        return (
            <div>
                {currentPage}
            </div>
        );
    }
}


export default LoginPage;