import { getUserData, getUsers, getGameStats, sendUpdateRequest, getusergameinfo } from "./userUtils";


class PPelement extends HTMLElement {
  constructor() {
    super();
    this._state = {
      allUsers: [],
      userProfile: null,
    };
    this.updateState = this.updateState.bind(this);
    this.handleGameData = this.handleGameData.bind(this);
    this.handleGameStats = this.handleGameStats.bind(this);
    
  }
  async connectedCallback() {
    try{
      const username = this.getAttribute('username');
      const userProfile = await getUsers();
      const arrayUsers = userProfile.users;
      console.log('userProfile-data', userProfile);
      const foundUser = arrayUsers.find(user => user.username === username);
      console.log("foundUser", foundUser);
      if(foundUser) {
        await this.updateState({
          userProfile: {
            username: foundUser.username,
            picture: foundUser.picture,
            gamestats: {
              wins: 0,
              losses: 0,
              scores: [],
            },
          },
        });
        await this.handleGameData(foundUser.username);
      }
      await this.render(); 
    }catch(error) {
      console.error('Error in connectedCallback:', error);
    }
  }

 
  
  async handleGameData(username) {
    try {
        const gameData = await getGameStats();
        console.log('gameData', gameData);
        const gamelists = gameData.gamelist;
        if (!gamelists || gamelists.length === 0) {
            throw new Error('No game data fetched!');
        }
        let wins = 0;
        let losses = 0;
        const scores = [];
        gamelists.forEach(game => {
            if (game.player1 && game.player1.username === username) {
                scores.push({ opponent: game.player2.username, score: `${game.player1_score}-${game.player2_score}`, date: new Date(game.start_time).toLocaleDateString() });
                if (game.player1_score > game.player2_score) {
                    wins++;                    
                } else {
                    losses++;
                }
            } else if (game.player2 && game.player2.username === username) {
                scores.push({ opponent: game.player1.username, score: `${game.player2_score}-${game.player1_score}`, date: new Date(game.start_time).toLocaleDateString()});
                if (game.player2_score > game.player1_score) {
                    wins++;
                } else {
                    losses++;
                }
            } else {
                console.log('The user has no game stats');
            }
        });
        
        const gamestats = { wins, losses, scores };
        const userProfile = { ...this._state.userProfile, gamestats: { wins, losses, scores } };
        await this.updateState({ userProfile});
        return gamestats;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
  }


  async updateState(newState) {
    this._state = {...this._state, ...newState};
    await this.render();
  }
  
getmodal(){
  this.innerHTML = /*html*/ `
  <div id="updateModal" class="modal">
    <div class="modale-content">
      <span class="close">&times;</span>
      <form id="updateForm">
        <div class="mb-3">
          <label for="username" class="form-label">Username</label>
          <input type="text" class="form-control" id="username" name="username" required>
        </div>
        <div class="mb-3">
            <label for="picture" class="form-label">Profile Picture Url</label>
            <input type="text" class="form-control" id="picture" name="picture">
        </div>
        <div>
          <label for="password" class="form-label">New Password</label>
          <input type="password" class="form-control" id="password" name="password">
        </div>
        <button type="submit" class="btn btn-primary">Update</button>
      </form>
    </div>
  </div>
  
  `
}
  async render() {
    const {userProfile} = this._state;
    const { username, gamestats } = userProfile;
    console.log('gamestats in render()', gamestats);
    const generatedHTML = /*html*/`
      <div class="container-fluid p-0 d-flex h-100">
        <!-- Sidebar -->
        <div id="sidebar" class="d-flex flex-column p-3">
          <header id="chat-header" class="d-flex align-items-center mb-4">
            <div class="profile-picture me-3">
              <img class="shadow own-profile-picture" src="${localStorage.getItem("picture")}" width="50" alt="profile_pic" />
            </div>
            <h3 id="profileUserName" class=" own-profile-username text-white me-3">${username}</h3>
            <svg id="editIcon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-edit-2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </header>
          <div id="userStats">
            <div class="btn-group-vertical" role="group">
              <button class="btn btn-primary me-4" type="button" onclick="document.querySelector('profile-page').showSection('game-stats')">
                Game Stats
              </button>
              <button class="btn btn-primary me-4" type="button" onclick="document.querySelector('profile-page').showSection('matchHistory')">
                Match History
              </button>
              <button class="btn btn-primary" type="button" onclick="document.querySelector('profile-page').showSection('currentSituation')">
                Current Situation
              </button>
            </div>
          </div>
        </div>
        <div id="right-panel" class="d-flex flex-column flex-grow-1">
          <!-- Data Displaying Area -->
          <div id="userProfileStats" class="container-fluid p-0 flex-grow-1">
            <div id="game-stats" class="content-section">
              ${this.generateGameStats(gamestats)}
            </div>
            <div id="matchHistory" class="content-section">
              ${this.generateMatchHistory()}
            </div>
            <div id="currentSituation" class="content-section">
              ${this.generateCurrentSituation()}
            </div>
          </div>
        </div>
      </div>
     
      <!-- Add this HTML to your page -->
    <div id="updateModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <form id="updateForm">
          <div class="mb-3">
            <label for="username" class="form-label">Username</label>
            <input type="text" class="form-control" id="username" name="username" required>
          </div>
          <div class="mb-3">
            <label for="picture" class="form-label">Profile Picture URL</label>
            <input type="file" class="form-control" id="picture" name="picture">
          </div>
          <div class="mb-3">
            <label for="password" class="form-label">New Password</label>
            <input type="password" class="form-control" id="password" name="password">
          </div>
          <button type="submit" class="btn btn-primary">Update</button>
        </form>
      </div>
    </div>
    `;
    this.innerHTML = generatedHTML;  
    await this.handleGameStats();

    this.updateFormAddEventListener();
  }
  
// Method to handle user info update
async updateUserInfo(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    // Send updated data to the backend
    const data = await sendUpdateRequest(formData);
    // Update the local state and UI with the new data
    const setdata = await getUserData();

    setdata.currentuser = data;
    localStorage.setItem("picture", data.picture);
    localStorage.setItem("username", data.username);
    localStorage.setItem("password", data.password);

    this.render(); 
    document.querySelector('#updateModal').style.display = 'none';
  } catch (error) {
    console.error('Failed to update user info', error);
    // Display an error message to the user
    alert(error.message);
  }
}


// Add event listener for the edit icon and form submission
  updateFormAddEventListener() {
  const editIcon = document.querySelector('#editIcon');
  const updateModal = document.querySelector('#updateModal');
  const closeModal = updateModal.querySelector('.close');

    editIcon.addEventListener('click', () => {
    updateModal.style.display = 'block';
    const userProfile = this._state.userProfile;
    document.querySelector('#updateForm #username').value = userProfile.username;
    document.querySelector('.profile-picture').src = `${userProfile.picture}`;

  });

  closeModal.addEventListener('click', () => {
    updateModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === updateModal) {
      updateModal.style.display = 'none';
    }
  });

  // Add form submission handler
  const updateForm = document.querySelector('#updateForm');
  updateForm.addEventListener('submit', this.updateUserInfo.bind(this));
}


  showSection(sectionId) {
    console.log('Showing section:', sectionId);
    const sections = this.querySelectorAll('.content-section');
    console.log('Found sections:', sections.length);
    sections.forEach(section => {
      section.classList.remove('active');
      console.log('Removed active class from:', section.id);
    });
    const activeSection = this.querySelector(`#${sectionId}`);
    if (activeSection) {
      activeSection.classList.add('active');
      console.log('Added active class to:', sectionId);
    } else {
      console.log('Section not found:', sectionId);
    }
  }

  generateGameStats(gamestats) {
    if (!gamestats) {
      console.log('No gamestats available');
      return '<p>No game stats available</p>';
    }
    const { wins = 0, losses = 0, scores = [] } = gamestats;
    const scoreList = scores.map(score => `<li class="nav-item stats"> ${score.opponent}: ${score.score}  </li>`).join('');
    const dateTime = scores.map (score => `<li class="nav-item stats"> ${score.date}</li>`).join('');
 
    return /*html*/`
      <div class="card card-body">
        <!-- Game stats content -->
        <p>Game stats
          <div class="text-center">
            <h2 id="history-text"></h2>
            <p id="wins">Wins: ${wins}</p>
            <p id="losses">Losses: ${losses}</p>
            <h5>Scores:</h5>
            <ul class="">${scoreList}</ul>
            <h5>Date:</h5>
            <ul class="">${dateTime}</ul>
          </div>
        </p>
      </div>
    `;
  }
  
  generateMatchHistory() {
    return this.innerHTML = /*html*/`
      <div class="card card-body">
        <!-- Match history content -->
        <div class="constainer my-5 ">
          <p id="username-display" class="display-4 my-4 mx-2 text-primary fw-bold"></p>
        </div>
      
        <section id="shortHistory">
          <div class="container-md">
            <div class="text-center">
              <h2 id="history-text"></h2>
            </div>
            <div class="accordion my-3" id="chapters">
              <section id="acHistory">
              </section>
            </div>
          </div>
        </section>
      </div>
    `;
  };
  
  generateCurrentSituation() {
    return this.innerHTML = /*html*/`
    <!-- Current situation content -->
      <div class="card card-body">
        <p>Current situation will be displayed here.
        </p>
      </div>
    `;
  };
  
  
  
  async handleGameStats() {
    try {
    
      const games = await getGameStats();
      console.log("game history", games);
      if (!games || !games.gamelist) {
        // document.querySelector("#username-display").textContent = "Profile";
        document.querySelector("#history-text").textContent = "User Profile";
        
        throw new Error("No json fetched!");
      }
      console.log("am here");
      const data = games.gamelist;
      document.getElementById("username-display").textContent = this._state.userProfile.username;
      // document.getElementById("first-display").textContent = this._state.userProfile.first_name + ' ' + this._state.userProfile.last_name;
      const acHistory = document.querySelector("#acHistory");
      acHistory.innerHTML = ''; //clear previous content if any
      for(const[index, game] of data.entries()){
        let st = new Date(game.start_time);
        let et = new Date(game.end_time);
        let tt = Math.round((et - st) / 1000);
        document.querySelector("#acHistory").innerHTML += /* html */ `
        <div class="accordion-item">
          <h2 class="accordion-header" id="heading-${index}">
            <button class="accordion-button" type="button" data-bs-toggle="collapse"
            data-bs-target="#chapter-${index}" aria-expanded="true"
            aria-controls="chapter-${index}">
            Game ${index} - ${st.toLocaleDateString("FR")}
          </button>
        </h2>
        <div id="chapter-${index}" class="accordion-collapse collapse"
        aria-labelledby="heading-${index}" data-bs-parent="#chapters">
        <div class="accordion-body">
          <table class="table table-striped">
            <thead>
              <tr>
                <th scope="col" class="fs-5">game id</th>
                <th scope="col" class="fs-5">duration</th>
                <th scope="col" class="fs-5">ball speed</th>
                <th scope="col" class="fs-5">paddle color</th>
                <th scope="col" class="fs-5">paddle speed</th>
                <th scope="col" class="fs-5">paddle size</th>
                <th scope="col" class="fs-5">player 1</th>
                <th scope="col" class="fs-5">player 2</th>
                <th scope="col" class="fs-5">player1 score</th>
                <th scope="col" class="fs-5">player2 score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">${game.id}</th>
                <td>${Math.floor(tt / 60)}m ${tt % 60}s</td>
                <td>${game.settings.ball_speed}</td>
                <td>${game.settings.paddle_color}</td>
                <td>${game.settings.paddle_speed}</td>
                <td>${game.settings.paddle_size}</td>
                <td>${game.player1.username}</td>
                <td>${game.player2.username}</td>
                <td>${game.player1_score}</td>
                <td>${game.player2_score}</td>

              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    `;
    }
    
    }catch(err) {
      console.log("Error caught!", err);
    }
  }

  
}

customElements.define("profile-page", PPelement);