import { navigate } from "../main";
import { getUsers, getUserData, createTournament, getTournamentInfo } from "./userUtils";

class tournamentNew extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = /* html */ `
      <div class="constainer my-5">
        <p class="display-4 my-4 mx-2 text-primary fw-bold">Tournaments</p>
        <div class="container text-center">
          <div class="row">
            <div class="col">
              <form id="tournament-form" method="post">
                <input type="text" name="name" placeholder="Tournament Name" required>
                <div id="player-selection" class="col">
                  <h2 id="select-player-h2">Select Players</h2>
                </div>
                <div class="me-4 mt-3 text-center">
                  <button type="submit" id="create-tournament" class="btn btn-primary">Create Tournament!</button>
                </div>
              </form>
          </div>
        </div> 
        <section id="TournamentHistory">
          <div class="container-md">
            <div class="text-center">
              <!-- <h3 id="history-text">Tournament History</h3> -->
            </div>
            <div class="accordion my-3" id="chapters">
              <section id="acTournamentHistory">
              </section>
            </div>
          </div>
        </section>
      </div>
    `;
    this.fetchPlayers();
    this.addFormEventListener();
  }
  
  async fetchPlayers() {

      const selectUsers = await getUsers();
      const usersToSelect = document.querySelector("#select-player-h2");
      const currentuser = await getUserData();

      console.log("currentuser", currentuser);

      console.log('selectUsers', selectUsers);

      if(selectUsers){
        this.renderPlayerList(selectUsers, currentuser);

      } else {
          usersToSelect.textContent = "Please log in";
          throw new Error("No json fetched!");
          
        }
    }


    renderPlayerList(userlist, currentuser) {
      console.log('datalist', userlist.users);

      const playerSelection = this.querySelector("#player-selection");
      let html = `
        <div id="player-list" class="btn-group-vertical" role="group" aria-label="Vertical checkbox toggle button group">
          <input type="checkbox" class="btn-check" id="name-0" name="players" value="${currentuser.id}" autocomplete="off" checked disabled>
          <label class="btn btn-outline-primary" for="name-0">
          ${currentuser.username}(me)
          </label>
      `;
      userlist.users.forEach((user, index) => {
        if(user.username !== userlist.current_username) {
          html += `
            <input type="checkbox" class="btn-check" id="name-${index + 1}" name="players" value="${user.id}" autocomplete="off">
            <label class="btn btn-outline-primary" for="name-${index + 1}">
            ${user.username}
            </label>
          `;
        }

      });
      html += '</div>';
      playerSelection.innerHTML = html;
      
    }


    addFormEventListener() {
      const tournamentForm = this.querySelector("#tournament-form");
      if(!tournamentForm) {
        console.error("Tournament form not found");
        return;
      }
      const createTournamentButton = tournamentForm.querySelector("#create-tournament");
      if(!createTournamentButton) {
        console.error("Create tournament button not found");
        return;
      }
      createTournamentButton.addEventListener('click', async (event) =>{
        event.preventDefault();
        // select players create formdata 
      console.log("Create tournament button cleicked");
        const formData = new FormData(tournamentForm);
        const playerInputs = tournamentForm.querySelectorAll('input[name="players"]:checked');
        console.log("playerInputs", playerInputs);
        const playerIds = Array.from(playerInputs).map(input=> input.value);
    

        const tournamentData = {
          name: formData.get("name"),
          players: playerIds,
        };
        console.log("tournamentData", tournamentData);

        if (!tournamentData.name || tournamentData.players.length === 0) {
          alert("Please enter a tournament name and select at least one player.");
          return;
        }
        try{
          const createtournament = await createTournament(tournamentData);
          console.log('createTournamentt', createTournament);
          // alert("Tournament created successfully!");

          if (createtournament && createtournament.id) {
            const path = `/tournament/${createtournament.id}`;
            navigate(path);
          } else {
            console.error("Created tournament doesn't have an ID");
          }

        } catch(error) {
          console.error("Error creating Tournament:", error);
          alert("Failed to create tournament. please try again.");
        }

      });

    }

    renderCreatedTournament(tournament) {
      const tournamentHistory = document.querySelector("#acTournamentHistory");
      // const playersList = tournament.players.map(player => player.id).join(', ');
      const playersListHtml = tournament.players.map(player => `
      <li class="stats">${player.player_username} (${player.eliminated ? 'Eliminated' : 'Active'})</li>
      `).join('');
      const newTournamentHtml = /* html */ `
        <div class="accordion-item">
          <h2 class="accordion-header" id="heading-${tournament.id}">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#chapter-${tournament.id}" aria-expanded="true" aria-controls="chapter-${tournament.id}">
              Tournament ${tournament.name} - ${new Date(tournament.created_at).toLocaleString()}
            </button>
          </h2>
          <div id="chapter-${tournament.id}" class="accordion-collapse collapse show" aria-labelledby="heading-${tournament.id}" data-bs-parent="#chapters">
            <div class="accordion-body">
              <p>Creator: ${tournament.creator.username}</p>
              <ul>
                ${playersListHtml}
              </ul>
              <div id="next-match"></div>
            </div>
          </div>
        </div>
      `;
      tournamentHistory.insertAdjacentHTML('afterbegin', newTournamentHtml);
    }
    

  }

  
  customElements.define("tournament-new", tournamentNew);
 
   