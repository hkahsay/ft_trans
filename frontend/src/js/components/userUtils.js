

export async function isLoggedIn(){
    return await fetch('https://localhost:8080/api/users/me/status/', {
        method: 'GET',
        headers: {
            'accept': 'application/json',
        },
        credentials: 'include'
    })
    .then(response => {
        console.log("status", response.status);
        return (response.status === 200);
    })
    .catch(error => {return  false});
}


export function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    if (!cookieValue) {
        console.error('Cookie not found for name:', name);
    }
    return cookieValue;
}

/**
 * @returns info about the logged in user (me)
 */

 export const getUserData = async () => {
    try {
      const response = await fetch('https://localhost:8080/api/users/me/data/', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
        },
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      console.log('Fetched user data:', data);  // Log the fetched data for inspection
      return data;
    } catch (error) {
      console.error('Error fetching user data:', error.message);
      return null;
    }
  };

/**
 * @returns info about all users
 */
export async function getFriendList() {
  try{
      const response = await fetch('https://localhost:8080/api/users/friendlist/', {
          method: 'GET',
          headers: {
              'accept': 'application/json',
          },
          credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data =  await response.json();
      return data;
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        throw error;
    }
}

export async function getUserProfileStatus() {
    try {
        const response = await fetch('https://localhost:8080/api/users/profile/', {
          method: 'GET',
          headers: {
            'accept': 'application/json',
          },
          credentials: 'include'
        });
    
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
    
        const data = await response.json();
        console.log('Fetched user data:', data);  // Log the fetched data for inspection
        return data;
      } catch (error) {
        console.error('Error fetching user data:', error.message);
        return null;
      }

}

export async function getGameStats() {
    try {
        const response = await fetch('https://localhost:8080/api/users/players/info/', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            },
            credentials: 'include'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    }catch(error) {
        console.error('Error fetchng user data:', error.message);
        return null;
    }
}

export async function getusergameinfo(username){
    try{
        const response = await fetch(`http://localhost:8080/api/players/info/${username}`, {
          method: 'GET',
          headers: {
              'accept': 'application/json',
          },
          credentials: 'include'
        });
        if(!response.ok){
          throw new Error('Network was not ok' + response.statusText);
        }
        const data = await response.json();
        return data;
    }catch(error) {
        console.error('Error fetching user game data', error);
        return null;
    }
}
export async function addFriend(username) {
    try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch('https://localhost:8080/api/users/addfriend/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json',
                'X-CSRFToken': csrfToken  // Include the CSRF token 
            },
            credentials: 'include',
            body: JSON.stringify({ username: username })
        });

        if (!response.ok) {
            throw new Error('Failed to add friend');
        }

        return await response.json();
    } catch (error) {
        console.error('Error adding friend:', error.message);
        throw error;
    }
}

export async function sendUpdateRequest(updatedData) {
    try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch('https://localhost:8080/api/users/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': csrfToken  // Include the CSRF token 
            },
            credentials: 'include',
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
            throw new Error('Failed to update user info');
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating user info:', error.message);
        throw error;
    }
}



export async function blockUser(username) {
    try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch(`https://localhost:8080/api/users/block/${username}/`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to block friend');
        }

        return await response.json();
    } catch (error) {
        console.error('Error blocking friend:', error.message);
        throw error;
    }
}

export async function getBlockedUsers() {
    try {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch(`https://localhost:8080/api/users/blocked/`, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch blocked users');
        }

        const data = await response.json();
        return data; // Assuming the server response has the blocked users in a 'blocked_users' property
    } catch (error) {
        console.error('Error fetching blocked users:', error.message);
        throw error;
    }
}


export async function getUsers() {
    try {
        const response = await fetch('https://localhost:8080/api/users/tournaments/creation/', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
        const users = await response.json();
        return users; // Ensure this is an array
    } catch (error) {
        console.error('Error fetching user data:', error.message);
        throw error;
    }
}

export async function updateFriendStatus() {
    try {
        const response = await fetch('https://localhost:8080/api/users/get-friend-status/', {
            method: 'GET',
            headers: {
                'accept': 'application/json',
            },
            credentials: 'include',
        });
        if(!response.ok){
            throw new Error('Failed to fetch user data');
        }
        const data = await response.json();
        const friendStatus = data.friend_status;
        return  friendStatus;

    } catch(error) {
        console.error('Error fetching user data:', error.message);
        throw error;
    }
}

  