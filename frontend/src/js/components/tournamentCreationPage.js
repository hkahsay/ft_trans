import { getUsers } from "./userUtils";

class tournamentCreationPage extends HTMLElement {
  constructor() {
    super();

    this.innerHTML = /* html */ `
      <div class="constainer my-5">
        <p class="display-4 my-4 mx-2 text-primary fw-bold">Tournaments</p>
        <div class="container text-center">
          <div class="row">
            <div class="col">
              <form id="tournament-form" method="post">
                <div id="player-selection" class="col">
                  <h2 id="select-player-h2">Select Players</h2>
                  </div>
                  <div class="me-4 mt-3 text-center">
                     <button type="submit" class="btn btn-primary">Create Tournament!</button>
                 </div>
              </form>
            <div class="col">
          </div>
        </div> 
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
      </div>
    `;
    this.fetchPlayers();
    // this.addEventListener();
  }

  // <!-- Add this HTML to your page -->
  // <div id="updateModal" class="modal">
  //   <div class="modal-content">
  //     <span class="close">&times;</span>
  //     <form id="updateForm">
  //       <div class="mb-3">
  //         <label for="username" class="form-label">Username</label>
  //         <input type="text" class="form-control" id="username" name="username" required>
  //       </div>
  //       <div class="mb-3">
  //         <label for="picture" class="form-label">Profile Picture URL</label>
  //         <input type="text" class="form-control" id="picture" name="picture">
  //       </div>
  //       <div class="mb-3">
  //         <label for="password" class="form-label">New Password</label>
  //         <input type="password" class="form-control" id="password" name="password">
  //       </div>
  //       <button type="submit" class="btn btn-primary">Update</button>
  //     </form>
  //   </div>
  // </div>
  

  async fetchPlayers() {

      const createTournament = await getUsers();
      if(createTournament){
        this.renderPlayerList(createTournament);

      } else {
          document.querySelector("#select-player-h2").textContent = "Please log in";
          throw new Error("No json fetched!");
          
        }
    }

    renderPlayerList(data) {
      document.querySelector("#player-selection").innerHTML += /* html */ `
        <div id="player-list" class="btn-group-vertical" role="group" aria-label="Vertical radio toggle button group">
          <input type="checkbox" class="btn-check" id="name-0" name="player-0" autocomplete="off" checked disabled>
          <label class="btn btn-outline-primary" for="name-0">
            ${data.current_username} (me)
          </label>
        </div>
      `
      for(const[index, user] of data.users.entries()){
        if(user.username !== data.current_username) {
          document.querySelector("#player-list").innerHTML += /* html */ `
              <input type="checkbox" class="btn-check" id="name-${index + 1}" name="player-${index + 1}" autocomplete="off">
              <label class="btn btn-outline-primary" for="name-${index + 1}">
                ${user.username}
              </label>
          `
        }
      }
      
    }

    addEventListener() {
      const form = this.querySelector("#tournament-form");
      form.addEventListener( 'submit', event =>{
        event.preventDefault();
        const formData = new FormData(form);
        fetch("https://localhost:8080/api/users/tournaments/creation/", {
          method: 'POST',
          body: formData,
          credentials: ' include'

        }).then(response => response.json())
        .then(data =>{
          if(data.success) {

          } else {
            console.error();//handle errors
          }
        }).catch(err=> {
          console.error("Error creating tournament:", err);
        })
      });

    }
  
  }
  
  customElements.define("tournament-preation-page", tournamentCreationPage);
  
   