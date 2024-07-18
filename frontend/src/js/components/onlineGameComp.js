import { getUsers, getUserData, createTournament, getTournamentInfo } from "./userUtils";

class OnlineGameCreationElement extends HTMLElement {
	constructor() {
	  super();
  
	  this.innerHTML = /* html */ `
		<div class="constainer my-5">
		  <p class="display-4 my-4 mx-2 text-primary fw-bold">Remote Game</p>
		  <div class="container text-center">
			<div class="row">
			  <div class="col">
			  	<form id="tournament-form" method="post">
					<div id="player-selection" class="col">
						<h2 id="select-player-h2">Select Players</h2>
					</div>
					<div class="me-4 mt-3 text-center">
                  		<button type="submit" id="create-remote" class="btn btn-primary">Create Remote Game!</button>
                	</div>
				</form>
			  <div class="col">
			</div>
		  </div> 
		  <section id="TournamentHistory">
			<div class="container-md">
			  <div class="text-center">
				<h3 id="history-text"></h3>
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
	//   this.addFormEventListener();
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
	
	
	  
  
	//   fetch("https://localhost:8080/api/users/tournaments/creation/", {credentials: 'include'}).then((response) => {
	// 	console.log("Fetch call resolved", response);
	// 	if (!response.ok)
	// 	  return null;
	// 	const datas = response.json();
	// 	console.log("datas", datas);
	// 	return datas;
	//   }).then(data => {
	// 	if (data === null) {
	// 	  document.querySelector("#select-player-h2").textContent = "Please log in";
	// 	  throw new Error("No json fetched!");
	// 	}
	// 	document.querySelector("#select-player-h2").textContent = "Select players";
	// 	document.querySelector("#player-selection").innerHTML += /* html */ `
	// 	  <div id="player-list" class="btn-group-vertical" role="group" aria-label="Vertical radio toggle button group">
	// 		<input type="checkbox" class="btn-check" id="name-0" name="player-0" autocomplete="off" checked disabled>
	// 		<label class="btn btn-outline-primary" for="name-0">
	// 		  ${data.current_username} (me)
	// 		</label>
	// 	  </div>
	// 	`
	// 	for(const[index, user] of data.users.entries()){
	// 	  if(user.username !== data.current_username) {
	// 		document.querySelector("#player-list").innerHTML += /* html */ `
	// 			<input type="checkbox" class="btn-check" id="name-${index + 1}" name="player-${index + 1}" autocomplete="off">
	// 			<label class="btn btn-outline-primary" for="name-${index + 1}">
	// 			  ${user.username}
	// 			</label>
	// 		`
	// 	  }
	// 	}
	// 	document.querySelector("#player-selection").innerHTML += /* html */ `
	// 	  <div class="mt-2 text-center">
	// 		<button type="submit" class="btn btn-primary">Create Tournament!</button>
	// 	  </div>
	// 	`
	//   }).catch((err) => {
	// 	console.log("Error caught!", err);
	//   });


	
  }
  
  customElements.define("onlinegame-creation", OnlineGameCreationElement);
  