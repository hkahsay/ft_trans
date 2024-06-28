import { getFriendList, addFriend, blockUser, getUsers, getUserData, getBlockedUsers, isLoggedIn, updateFriendStatus } from "./userUtils";
import { WebSocketService } from "./userSocket";


export class FriendList extends HTMLElement {


    constructor(){
        super();
        this._state = {
            friends: [],
            currentUser: null,
            allUsers: [],
            blockedUsers:[],
            connectedUsers: []
        };

        const statusWebSocketService = WebSocketService.getInstance();
        statusWebSocketService.connect().then(() => {
            console.log("WebSocket connection established.");
            
        });

        statusWebSocketService.addCallback('status_query_response', this.handleStatusUpdate.bind(this));
        statusWebSocketService.addCallback('status_change', this.handleStatusChange.bind(this));
    
        this.updateState = this.updateState.bind(this);
        this.handleAddFriend = this.handleAddFriend.bind(this);
        this.handleBlockUser = this.handleBlockUser.bind(this);
        this.handleEnterKeyPress = this.handleEnterKeyPress.bind(this);
    }

    connectedUsersDictToArray(dict) {
        let connectedUsers = []
        for (const userId of Object.keys(dict)) {
            if (dict[userId]) {
                connectedUsers.push(userId);
            }
        }
        return connectedUsers;
    }
    
    handleStatusUpdate(data) {
        const connectedUsersArray = this.connectedUsersDictToArray(data.statuses)
        
          // Flatten the connectedUsersArray to ensure it's a single array
          this.updateState({ 
            ...this._state, 
            connectedUsers: connectedUsersArray.flat()
        });
      }
    
    handleStatusChange(data) {
        const { user_id, is_online } = data;
    
        let newConnectedUsers;
        if (is_online) {
            if (this._state.connectedUsers.includes(user_id)) {
                newConnectedUsers = this._state.connectedUsers;
            } else {
                newConnectedUsers = [...this._state.connectedUsers, user_id];
            }
        } else {
            newConnectedUsers = this._state.connectedUsers.filter(id => id !== user_id);
        }
    
        this.updateState({ 
            ...this._state, 
            connectedUsers: newConnectedUsers 
        });
    }

    async connectedCallback() {
        try {
            const currentUser = await getUserData();
            if (!currentUser || Object.keys(currentUser).length === 0) {
                console.error('Current user data is null or empty.');
                return;
            }
           
            const friendsResponse = await getFriendList();
                if (!friendsResponse) {
                    console.error('Failed to fetch users data.');
                    return;
                }
            const users = friendsResponse;

            const allUsersResponse = await getUsers();
            console.log('Fetched all users data:', allUsersResponse);
            if (!allUsersResponse || !allUsersResponse.users || !Array.isArray(allUsersResponse.users)) {
                console.error('Failed to fetch all users, Response is not an array:', allUsersResponse);
                return;
            }
            const allUsers = allUsersResponse.users;
            
            const blockedUsersResponse = await getBlockedUsers();
            const blockedUsers = blockedUsersResponse.blocked_users || [];

             // send the request status query change to server
            const statusWebSocketService = WebSocketService.getInstance();
            statusWebSocketService.sendMessage({
                action: 'status_query',
                requester: currentUser.id,
                friend_ids: users.map(user => user.id)
            });
            
            this.updateState({
                friends: users,
                currentUser: currentUser,
                allUsers: allUsers,
                blockedUsers: blockedUsers,
            });           
    
        } catch (error) {
            console.error('Error in connectedCallback:', error);
        }
    }

    updateState(newState) {
        this._state = {...this._state, ...newState};
        this.render();
    }

    async handleAddFriend(event) {
        event.preventDefault();
        const username = this.querySelector("#friend-username").value;
        if (!username) {
            console.error('Username is required to add a friend.');
            return;
        }
        //check if there is more than one user registered
        if(this._state.allUsers < 2){
            console.error('No user is registered');
        }    
            // Check if the username exists in the list of all users
        const userExists = Array.isArray(this._state.allUsers) && this._state.allUsers.some(user => user.username === username);
        if (!userExists) {
            console.error('Username does not exist.');
            return;
            }
             // Check if the user is already a friend
        const isAlreadyFriend = this._state.friends.some(friend => friend.username === username);
        if (isAlreadyFriend) {
            console.error(`${username} is already a friend.`);
            return;
        }
        const currentUserneednotAdded = this._state.currentUser.username;
        if(currentUserneednotAdded ===username)
        {
            console.error(`${username} is a current user can not be added.`);
            return;
        }

        try {
            await addFriend(username);
            console.log("Friend request sent to", username);
            const response = await getFriendList();
            if (response && Array.isArray(response)) {
                const friends = response.filter(user => this._state.currentUser.username !== user.username);
                this.updateState({ friends });
            } else {
                console.error('Failed to fetch users data.');
            }
        } catch (error) {
            if (error.status === 400 && error.message === "Friend request already sent") {
                console.error('Friend request already sent to', username);
            } else {
                console.error('Error adding friend:', error);
            }
        }
    }

    async handleBlockUser(username) {

        try {
            await blockUser(username);
            const blockUsers = [...this._state.blockedUsers, { username }];
            this.updateState({ blockUsers });
            console.log("user is blocked", username);
        } catch(error) {
            console.error('Error removing friend:', error);
        }
    }
  
  

    renderAddedFriend() {
        if (!Array.isArray(this._state.friends) || this._state.friends.length === 0) {
            console.error('Friends list is empty or null');
            return '<p>Friends Not yet Added</p>';
        }
        if (!Array.isArray(this._state.connectedUsers) || this._state.connectedUsers.length === 0) {
            console.log('Waiting for user status to be populated...');
        }

        return this._state.friends.map(friend => {
            const isOnline = this._state.connectedUsers.includes(friend.id);
            return `
              <li class="d-flex justify-content-between align-items-center nav-item">
                <span class="online-indicator ${isOnline ? 'online' : 'offline'}"></span>
                ${friend.username}
                <button class="btn btn-danger btn-sm remove-friend-btn" data-username="${friend.username}">Block</button>
              </li><hr>
            `;
        }).join('');
    }

    renderBlockedUsers() {
        if (!Array.isArray(this._state.blockedUsers) || this._state.blockedUsers.length === 0) {
            return '<p>No blocked users</p>';
        }
        return this._state.blockedUsers.map(user => `
            <li>
                ${user}
            </li>
        `).join('');
    }
    
    
    async handleEnterKeyPress(event) {
          
        if (event.key === 'Enter') {
            event.preventDefault();
            await this.handleAddFriend(event);
        }
    }

    render() {
        if (!this._state.friends || this._state.friends.length === 0) {
            console.log('No yet added friends.');
            this.innerHTML = '<p>No friends to display.</p>';
            
        }
    
        this.innerHTML = /*html*/`
        <div class="container-fluid p-0 d-flex h-100 border-top">
            <!-- Sidebar -->
            <div id="sidebar" class="d-flex flex-column p-3 text-white">
                <div id="friendList">
                    <ul id="friend-list" class="navbar-nav flex-column onlinestatus">
                        ${this.renderAddedFriend()}

                    </ul>
                </div>
            </div>
            <div id="right-pannel" class="d-flex">
            <div>
                <div class="">
                    <input id="friend-username" type="text" class="me-2 p-3" placeholder="Enter username">
                </div>
                <div class="">
                    <button id="add-friend-form" type="button" class="btn btn-primary rounded me-5 p-7">ADD FRIEND</button>
                </div>
            </div>
            <div>
                <h3>Blocked Users</h3>
                <ul>
                    ${this.renderBlockedUsers()}
                </ul>
            </div>


        </div>
    </div>
        `;
        this.querySelector("#add-friend-form").addEventListener("click", this.handleAddFriend);
        this.querySelectorAll(".remove-friend-btn").forEach(btn =>
            btn.addEventListener("click", (e) => this.handleBlockUser(e.target.dataset.username))
        );
        this.querySelector("#friend-username").addEventListener('keypress', this.handleEnterKeyPress.bind(this));
    }
    

}
customElements.define("friend-list", FriendList);