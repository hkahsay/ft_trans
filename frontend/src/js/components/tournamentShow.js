import { getTournamentlist, getCookie, playGame } from "./userUtils";
import { WebSocketService } from "./userSocket";
import { navigate } from "../main";

class tournamentShow extends HTMLElement {
    constructor() {
        super();
       
        this.handleTournamentNotification = this.handleTournamentNotification.bind(this);
        this.innerHTML = /*html*/`
        <div class="constainer my-5">
          <div id="notificationArea" class="alert alert-info" style="display: none;"></div>
            <section id="TournamentHistory">
              <div class="container-md">
                <div class="text-center">
                  <h3 id="history-text">Tournament History</h3> 
                </div>
                <div class="accordion my-3" id="chapters">
                  <section id="acTournamentHistory">
                  </section>
                </div>
              </div>
            </section>
        </div>`;
        WebSocketService.getInstance().connect().then(() => {
            console.log("WebSocket connection established.");
        })
        WebSocketService.getInstance().addCallback('tournament_notification', this.handleTournamentNotification.bind(this)); // Corrected argument order
        
      }

      async handleTournamentNotification(data) {
        console.log("Tournament notification received:", data);
        
        // Display the notification in the notification area
        const notificationArea = this.querySelector('#notificationArea');
        notificationArea.textContent = data.message;
        notificationArea.style.display = 'block';

        setTimeout(() => {
            notificationArea.style.display = 'none';
        }, 5000);

        // Add the notification to the tournament history
        this.addNotificationToHistory(data.message);
    }

    addNotificationToHistory(message) {
        const historySection = this.querySelector('#acTournamentHistory');
        const notificationElement = document.createElement('div');
        notificationElement.className = 'alert alert-info mt-2';
        notificationElement.textContent = message;
        historySection.prepend(notificationElement); // Add to the top of the list
    }


      
    async connectedCallback() {
      console.log("conectedcallback");
        try{
            const tournamentId = this.getAttribute('tournament-id');

            // Ensure tournamentId is a number for comparison
            const tournamentIdNumber = parseInt(tournamentId, 10);

            const getTournamentIds = await getTournamentlist();
            console.log("getTournamentIds from show", getTournamentIds);

            // Find the tournament with the matching ID
            const currentTournament = getTournamentIds.find(tournament => tournament.id === tournamentIdNumber);
            
            if (currentTournament) {
                console.log("Current Tournament:", currentTournament);
                this.renderCreatedTournament(currentTournament);
                await this.renderTournamentDetails(currentTournament.id)


                // this.handleTournament(currentTournament);
            } else {
                if(!tournamentId)
                  navigate('/tournament');
                else
                {
                    console.log("Tournament not founddd");
                    this.innerHTML = /* html*/ `<div>Tournament with id - ${tournamentId} is not found!</div>`;

                }
            }
    
        }catch(error) {
            console.error('Error in connectedCallback:', error);
          }
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
               <div id="next-match">

               </div>
              </div>
            </div>
          </div>
        `;
        tournamentHistory.innerHTML = newTournamentHtml;
        // tournamentHistory.insertAdjacentHTML('afterbegin', newTournamentHtml);
    }

    async startTournament(tournamentId) {
        try{
          const response = await fetch(`https://localhost:8080/api/users/tournaments/${tournamentId}/start/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': getCookie('csrftoken'),
            }
          });
          if(!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const match = await response.json();
          console.log("match-data", match);
          return match;
  
        } catch (error) {
          console.error("Error starting tournament:", error);
        }
      }
      

    async renderTournamentDetails(id) {
      const data = await this.startTournament(id);
      console.log("Tournament data:", data);
      console.log("Next games:", data.next_games);
      
      function renderTournamentTree(tree) {
        if (tree.id && tree.username) {
          // This is a leaf node (player)
          return `<div class="leaf">${tree.username}</div>`;
        } else if (tree === null || tree === undefined) {
          return `<div class="leaf">TBD</div>`;
        } else {
          // This is an internal node (game)
          return `
            <div class="game">
              <div class="subgames">
                ${renderTournamentTree(tree.left)}
                ${renderTournamentTree(tree.right)}
              </div>
              ${tree.winner ? `<div class="winner">${tree.winner.username}</div>` : `<div class="to-be-played">?</div>`}  
            </div>
          `;
        }
      }


      
      
      const tournamentDetailsHtml = `
        <h1>${data.name}</h1>
        <p>Created by ${data.creator}</p>
        <h2>Players</h2>
        <ul>
          ${data.players.map((p) => `<li>${p.username}</li>`).join("")}
        </ul>
        <h2>Tree</h2>
        <div class="tournament-tree">
          ${renderTournamentTree(data.tree)}
        </div>
        <p>${data.is_active ? 'Active' : 'Finished'}</p>
        ${data.winner ? `<h2>Winner</h2><p class="winner">${data.winner}</p>` : '<p>No winner yet</p>'}
        ${data.is_active ? `
          <h2>Next games</h2>
          <ul>
              
              ${data.next_games && data.next_games.length > 0 ? 
                data.next_games.map(
                  (g) => `
                  <li>
                    <span>${g.player1.username} vs ${g.player2.username}</span>
                    <form class="play-game-form">
                      <input type="hidden" name="tournament_id" id="tournament_id" value="${id}">
                      <input type="hidden" name="player1" id="player1" value="${g.player1.id}">
                      <input type="hidden" name="player2" id="player2" value="${g.player2.id}">
                      <label for="player1_score">Score ${g.player1.username}:</label>
                      <input type="number" name="player1_score" id="player1_score" placeholder="Score ${g.player1.username}">
                      <label for="player2_score">Score ${g.player2.username}:</label>
                      <input type="number" name="player2_score" id="player2_score" placeholder="Score ${g.player2.username}">
                      <button type="submit">Save game</button>
                    </form>
                  </li>
                `
                ).join("")  
                : '<li>No upcoming games</li>'}
          </ul>
        ` : '<p> The tournament has finished, no more games scheduled.</p>'}
      `;
      
      // Update the DOM with the new tournament details
      const tournamentHistoryContainer = document.querySelector("#next-match");
      if (tournamentHistoryContainer) {
        tournamentHistoryContainer.innerHTML = tournamentDetailsHtml;

          // Add a single event listener to the container
        tournamentHistoryContainer.addEventListener('click', async (event) => {
          if (event.target.type === 'submit' && event.target.closest('.play-game-form')) {
            event.preventDefault();
            const form = event.target.closest('.play-game-form');
            const gameData = {
              tournament: form.querySelector('#tournament_id').value,
              player1: form.querySelector('#player1').value,
              player2: form.querySelector('#player2').value,
              player1_score: parseInt(form.querySelector('#player1_score').value),
              player2_score: parseInt(form.querySelector('#player2_score').value),
              settings: {
                background_color: '#000000', 
                paddle_size: 100,             
                paddle_speed: 5,              
                paddle_color: '#FFFFFF',     
                ball_speed: 3               
              }
            };
            console.log("Submitting game data:", gameData);

            try {
              const result = await playGame(gameData);
              console.log("Game played successfully:", result);
              // Re-render the tournament details to show updated state
              await this.renderTournamentDetails(id);
            } catch (error) {
              console.error("Error playing game:", error);
              alert("Error playing game. Please try again.");
            }
          }
        });


      } else {
        console.error("Tournament history container not found");
      }
    }
    

    
}
customElements.define("tournament-show", tournamentShow);
