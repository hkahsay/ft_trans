import { WebSocketService } from "./userSocket";
import { getUserData, getUsers, getFriendList, getBlockedUsers } from "./userUtils";

export class ChatArea extends HTMLElement {
    
    constructor() {
        super();
      
        console.log("Connecting to WebSocket...");
        WebSocketService.getInstance().connect().then(() => {
            console.log("WebSocket connection established.");
        })
        WebSocketService.getInstance().addCallback('message', this.handleChatMessage.bind(this)); // Corrected argument order
    }
    
    updateState(newState) {
        this._state = newState;
        this.renderChatArea();
    }

    async connectedCallback() {
        try {
                // 1. Get current user
                const currentUser = await getUserData();
                if (!currentUser || Object.keys(currentUser).length === 0) {
                    console.error('Current user data is null or empty.');
                    return;
                }
                const getAllFriends = await getFriendList();
                if (!getAllFriends) {
                    console.error('Failed to fetch users data.');
                    return;
                }
                const getblockedList = await getBlockedUsers();

                const users = getAllFriends;

                const allUsersData = await getUsers();
                console.log('allUsersData', allUsersData);

                const otherUsers = users.filter(user => currentUser.id != user.id)
                let selectedUserId = null;
                if (otherUsers.length > 0) {
                    selectedUserId = otherUsers[0].id;
                }

                const gameLink = "/game";
                const gameInvitation = `Let's play <a href="${gameLink}">Pong Game</a>`;
                this.updateState({
                    messages: [],
                    sendInvitation: gameInvitation, 
                    users: users,
                    currentUser: currentUser,
                    selectedUserId: selectedUserId,
                    blockedList: getblockedList,
                    allUsers: allUsersData 
                
                });
            
        }catch(error) {
            console.error('Error in connectedCallback:', error);
        }   
    }

    handleChatMessage(data) {
        const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const newMessage = {
            content: data.message,
            sender: data.sender,
            receiver: data.receiver,
            senderImage: data.picture,
            time: timestamp
        };
 
        // Update the state with the new message and render the chat area
        this.updateState({ ...this._state, messages: [...this._state.messages, newMessage] });
     
    }

    renderChatArea() {
        const currentUser = this._state.currentUser ?? "Loading..."
        this.innerHTML = /*html*/`
            <div class=" container-fluid p-0 d-flex h-100 border-top">
                <!-- Sidebar -->
                <div id="sidebar" class="d-flex flex-column p-3 text-white">
                    <header class=""> 
                        <input type="text" id="search-button" class="form-control rounded-pill p-2" placeholder="search users..."><hr>
                        <!-- <button id="toggle-sidebar" class="btn btn-primary d-md-none">Menu</button> -->
                        
                    </header>
                    <div id="friendList">
                        <ul id="friendList" class="navbar-nav flex-column">
                            ${this.renderUserList()}
                        </ul>
                    </div>
                </div>
                <div id="right-pannel" class=" d-flex flex-column flex-grow-1">
                    <header id="chat-header" class="d-flex align-items-center shadow-lg">
                    <!-- <button id="toggle-sidebar-menu" class="btn btn-primary d-md-none me-2">Menu</button> -->
                        <div class="profile-picture">
                            <!--add active user with profile picture-->
                            <img class="own-profile-picture me-3 shadow" src="${localStorage.getItem("picture")}" width="50" alt="profile_pic" />
                        </div>
                        <h3 id="profileUserName" class="own-profile-username text-white me-3">${currentUser.username}</h3>
                    </header>
                    <!-- Chat Area -->
                    <div>
                        <!-- Your HTML template for the chat area -->
                        <div id="chatMessages" class="container-fluid p-0 flex-grow-1">
                            <div id="messages" class="container-fluid bg-li msg-bg" style="overflow-y: auto;">
                                <!-- Render messages here -->
                                ${this.renderMessagesForSelectedUser(this._state.messages)}
                             
                            </div>
                        </div>
                    </div>
                    <div class="container-fluid p-3 fixed-bottom text-white">
                        <form id="messageForm" class="input-group">
                            <input id="message-input" type="text" class="form-control flex-grow-1 me-2 p-3" placeholder="Type a message...">
                            <button id="send-button" type="button" class="btn btn-primary rounded">Send</button>
                            <a id="inviteGame" type="button" class="btn btn-primary rounded ms-2 m2-1" href="">Invite-Game</a>
                        </form>
                    </div>
                </div>
            
            </div>
        `;
        this.addMessageInputEventListener();
    }
    

    addMessageInputEventListener() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const inviteGame = document.getElementById('inviteGame');
        const searchButton = document.getElementById('search-button');

        if (!sendButton || !messageInput || !inviteGame || !searchButton) {
            console.error('Element not found');
            return;
        }
  
        
    const handleSendButtonClick = () => {
        const message = messageInput.value.trim();
        
        if (message !== '') {
            const wsInstance = WebSocketService.getInstance();
            if (wsInstance) {
                // Filter the friend list to remove blocked users
            
                const blockedUsers = this._state.blockedList.blocked_users;
                const friendsWithoutBlocked = this._state.users.filter(user => !blockedUsers.includes(user.username));

                // Check if the selected user is in the filtered list
                const isFriend = friendsWithoutBlocked.some(user => user.id === this._state.selectedUserId);
                
                if (isFriend) {
                    wsInstance.sendMessage({
                        action: 'message', 
                        message: message,
                        sender: this._state.currentUser.id,
                        receiver: this._state.selectedUserId,
                        sendInvitation: false // Indicate that this message is not an invitation
                    });
                } else {
                    console.error('Selected user is not a friend.');
                }
            }
            else {
                console.error('WebSocketService instance not available.');
            }
            messageInput.value = '';
        }
    };

        const handleInviteGameClick = (event) => {
            event.preventDefault();
            const wsInstance = WebSocketService.getInstance();
            if (wsInstance) {
                const gameInvitation = this._state.sendInvitation;
                const senderId = this._state.currentUser.id;
                const receiverId = this._state.selectedUserId;
                wsInstance.sendMessage({
                    action: 'message', 
                    message: gameInvitation,
                    sender: senderId,
                    receiver: receiverId,
                
                });
            } else {
                console.error('WebSocketService instance not available.');
            }
        };


        const searchUser = ()=> {
            const userList = document.querySelectorAll(".nav-link");
            const searchValue = searchButton.value.trim().toLowerCase();
    
            userList.forEach(user => {
                const userName = user.textContent.trim().toLowerCase();
                if(userName.includes(searchValue)){
                    user.style.display = "block"; // Show the user in the list if found
                } else {
                    user.style.display = "none"; // Hide the user if not found
                }
            });
        };

        const handleEnterKeyPress = (event) => {
          
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSendButtonClick();
            }
        };
       
        const friendList = document.querySelector("#friendList");
        friendList.addEventListener('click', (event) => {
            if (event.target.matches('.nav-link')) {
                const selectedUserId = event.target.getAttribute('id');
                this.updateState({ ...this._state, selectedUserId: selectedUserId });
                event.preventDefault();
            }
        });

        sendButton.addEventListener('click', handleSendButtonClick);
        messageInput.addEventListener('keypress', handleEnterKeyPress);
        inviteGame.addEventListener('click', handleInviteGameClick);
        searchButton.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchUser();
            }
        });
    }


    renderUserList() { 
        const { blocked_users } = this._state.blockedList;
        return this._state.users
            .filter(user => user.id !== this._state.currentUser.id)
            .map(user => {
                const selectedClass = (user.id === this._state.selectedUserId) ? "activeUser" : "";
                const isBlocked = blocked_users.includes(user.username);
                const blockedIcon = isBlocked ? `<span class="blocked-icon text-red">Blocked</span>` : "";
                const viewProfile = `<a id="profile-link" class="text-sm-end text-red" href="${"/profile/" + user.username.toLowerCase()}" data-link>viewprofile</a>`
                return `<li class="nav-item">
                            <a href="#" id="${user.id}" class="nav-link text-white ${selectedClass}">
                                ${user.username}
                                ${blockedIcon}
                                ${viewProfile}
                            </a>

                        </li>`;
            }).join('');
    }

    renderMessagesForSelectedUsers(messages) {
       
        return messages
            .filter(message => message.sender === this._state.selectedUserId || message.receiver === this._state.selectedUserId)
            .map(message => this.renderMessage(message)) // Use arrow function here
            .join("");
            
    }
    
    
    renderMessagesForSelectedUser(messages) {
        // Retrieve blocked usernames from the state
        const blockedUsers = this._state.blockedList.blocked_users;
    
        // Create a mapping from user IDs to usernames
        const userMap = this._state.allUsers.users.reduce((map, user) => {
            map[user.id] = user.username;
            return map;
        }, {});
    

        return messages
            .filter(message => {
                // Convert sender and receiver IDs to usernames using the map
                const senderUsername = userMap[message.sender];
                const receiverUsername = userMap[message.receiver];
    
               
                // Ensure usernames exist
                if (!senderUsername || !receiverUsername) {
                    console.error('Missing username mapping for sender or receiver.');
                    return false;
                }
    
                // Check if the sender or receiver is in the blocked list
                const isSenderBlocked = blockedUsers.includes(senderUsername);
                const isReceiverBlocked = blockedUsers.includes(receiverUsername);
                const isRelevantMessage = (message.sender === this._state.selectedUserId || message.receiver === this._state.selectedUserId);
    
                // Include the message only if neither the sender nor the receiver is blocked
                return isRelevantMessage && !isSenderBlocked && !isReceiverBlocked;
            })
            .map(message => this.renderMessage(message))
            .join("");
    }
    
    
    renderMessage(message) {
      
        const isCurrentUserSender = message.sender === this._state.currentUser.id;
      
        const messageAlignment = isCurrentUserSender ? "end" : "start";

        // Determine additional classes based on message alignment
        const messageContainerClass = isCurrentUserSender ? "sent" : "received";
        const messageCardClass = isCurrentUserSender ? "sent" : "received";
        
        return `
            <div class="row ">
                <div class="col message-container ${messageContainerClass}">
                    <div class="shadow-lg message-card sender active me-3 mb-3  ${messageCardClass}">
                        <div class="message-sender col-auto">
                            <div class="profile-picture">
                                <img class="me-3 shadow align-content-center" src="${localStorage.getItem("picture")}" width="50" alt="profile picture" />
                            </div>
                        </div>
                        <div class="message  message-content ms-3 mt-3">
                            ${message.content}
                        </div>
                        <div class="timestamp text-${messageAlignment} me-3 'fs-6'">
                            ${message.time}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
    }
}

// customElements.define('chat-area', ChatArea);
