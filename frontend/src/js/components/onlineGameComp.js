import { gameSocket } from "./gameSocket";

class OnlineGameCreationElement extends HTMLElement {
	localws = null;
	localwsUrl = `wss://localhost:8080/ws/users/games/online/noSelection/`;
	oppName = null;
	ball = new Path2D();
	paddleL = new Path2D();
	paddleR = new Path2D();
	ctx = null;

	constructor() {
		super();
  
		this.innerHTML = /* html */ `
			<p class="display-4 my-4 mx-2 text-primary fw-bold">Game creation</p>
			<form id="select_form">
				<div id="player-selection" class="col">
					<h2 id="select-player-h2"></h2>
				</div>
				<div class="my-2">
					<button type="submit" class="btn btn-primary">Select</button>
				</div>
			</form>
			<canvas id="myCanvas" width="500" height="300" style="border: 1px solid black; display: block;"></canvas>
			<button type="button" class="btn btn-warning" id="game_button">Connect WebSocket</button>
		`;

		fetch("https://localhost:8080/api/users/getAllUsers/", {credentials: 'include'}).then((response) => {
		console.log("Fetch call resolved", response);
		if (!response.ok)
			return null;
		return response.json();
		}).then(data => {
			if (data === null) {
				document.querySelector("#select-player-h2").textContent = "Please log in";
				throw new Error("No json fetched!");
			}
			document.querySelector("#select-player-h2").textContent = "Select players";
			document.querySelector("#player-selection").innerHTML += /* html */ `
				<select id="player-list" class="form_select" aria-label="opponent selection list">
					<option selected>Select your opponent</option>
				</select>
			`
			for(const[index, user] of data.users.entries()){
				document.querySelector("#player-list").innerHTML += /* html */ `
					<option value="${index + 1}">${user.username}</option>
				`
			}
		}).catch((err) => {
			console.log("Error caught!", err);
		});

		document.getElementById('select_form').addEventListener('submit', (event) => {
			event.preventDefault();
		// 	const selectedPlayer = document.getElementById('player-list').value;
		// 	if (selectedPlayer !== "Select your opponent") {
		// 		console.log("Selected player:", selectedPlayer);
		// 		this.localwsUrl = `wss://localhost:8080/ws/users/games/online/${selectedPlayer}/`;
		// 		console.log(`this.localwsUrl = ${this.localwsUrl}`);
		// 	} else {
		// 		alert("Please select an opponent.");
		// 	};
		});

		const myButton = document.getElementById("game_button");
		myButton.onclick = () => this.connectProcess();

		var canvas = document.getElementById("myCanvas");
		this.setupHiPPICanvas(canvas);
		if (canvas.getContext) {
			this.ctx = canvas.getContext("2d");

			this.paddleL.rect(10, 120, 15, 60);
			this.ctx.fillStyle = "rgb(200, 0, 0)";
			this.ctx.fill(this.paddleL);

			this.paddleR.rect(475, 120, 15, 60);
			this.ctx.fillStyle = "rgb(0, 0, 200)";
			this.ctx.fill(this.paddleR);

			this.ball.arc(250, 150, 5, 0, 2 * Math.PI);
			this.ctx.fillStyle = "black";
			this.ctx.fill(this.ball);

            this.ctx.font = "20px Arial";
            this.ctx.fillStyle = "black";
            this.ctx.textAlign = "center";
            this.ctx.fillText("0 - 0", 250, 20);
		}
	}

	connectProcess() {
        const myButton = document.getElementById("game_button");
        myButton.disabled = true;
        myButton.innerHTML = "Connected";
		if (this.localwsUrl != null && this.localws == null) {
			this.localws = new gameSocket(this.localwsUrl);
			this.localws.connect().catch((err) => {
                console.log("Error caught in connectProcess!", err)
				this.localws = null;
				myButton.innerHTML = "Reconnect";
				myButton.disabled = false;
            });
			window.addEventListener(
				"keydown",
				this.bindingsDown,
				true
			);
			window.addEventListener(
				"keyup",
				this.bindingsUp,
				true
			);
			this.localws.addCallback("input", (data) => {
				this.updateGameState(data);
			});
			this.localws.addCallback("waiting_for_players", (data) => {
				this.waitingScreen();
			});
			this.localws.addCallback("opponent_disconnected", (data) => {
				this.opponent_disconnected();
			});
		}
		else {
			alert("Already connected");
		}
	}

	updateGameState(data) {
		// Clear the canvas
		this.ctx.clearRect(0, 0, 500, 300);
	
		// Redraw paddles
		this.paddleL = new Path2D();
		this.paddleL.rect(data["leftPaddle"]["x"], data["leftPaddle"]["y"], 15, 60); // Adjust paddle size
		this.ctx.fillStyle = "rgb(200, 0, 0)";
		this.ctx.fill(this.paddleL);

		this.paddleR = new Path2D();
		this.paddleR.rect(data.rightPaddle.x, data.rightPaddle.y, 15, 60); // Adjust paddle size
		this.ctx.fillStyle = "rgb(0, 0, 200)";
		this.ctx.fill(this.paddleR);
	
		// Update ball position
		this.ball = new Path2D();
		this.ball.arc(data.ball.x, data.ball.y, 5, 0, 2 * Math.PI); // Adjust ball size
		this.ctx.fillStyle = "black";
		this.ctx.fill(this.ball);

        // Write player scores
        this.ctx.font = "20px Arial";
        this.ctx.fillStyle = "black";
        this.ctx.textAlign = "center";
        this.ctx.fillText(`${data.score.left} - ${data.score.right}`, 250, 20);
	}

	connectedCallback() {
		console.log("custom element connected.");
	}

	disconnectedCallback() {
		if (this.localws && this.localws.ws) {
			window.removeEventListener(
				"keydown",
				this.bindingsDown,
				true
			);
			window.removeEventListener(
				"keyup",
				this.bindingsUp,
				true
			);
			this.localws.ws.close();
			console.log("WebSocket connection closed.");
		}
		console.log("custom element disconnected.");
	}

	bindingsDown = (event) => {
		if (event.defaultPrevented || event.repeat) {
			return;
		}
		switch (event.key) {
			case "ArrowDown":
				// console.log("arrow down");
				this.localws.sendMessage({ action: "input", origin: "rightPlayer", key: {"down": 1}});
				event.preventDefault();
				break;
			case "ArrowUp":
				// console.log("arrow up");
				this.localws.sendMessage({ action: "input", origin: "rightPlayer", key: {"up": 1}});
				event.preventDefault();
				break;
			case "a":
				// console.log("a");
				this.localws.sendMessage({ action: "input", origin: "leftPlayer", key: {"up": 1}});
				event.preventDefault();
				break;
			case "z":
				// console.log("z");
				this.localws.sendMessage({ action: "input", origin: "leftPlayer", key: {"down": 1}});
				event.preventDefault();
				break;
		}
	};

	bindingsUp = (event) => {
		if (event.defaultPrevented) {
			return;
		}
		switch (event.key) {
			case "ArrowDown":
				// console.log("arrow down released");
				this.localws.sendMessage({ action: "input", origin: "rightPlayer", key: {"down": 0}});
				event.preventDefault();
				break;
			case "ArrowUp":
				// console.log("arrow up released");
				this.localws.sendMessage({ action: "input", origin: "rightPlayer", key: {"up": 0}});
				event.preventDefault();
				break;
			case "a":
				// console.log("a released");
				this.localws.sendMessage({ action: "input", origin: "leftPlayer", key: {"up": 0}});
				event.preventDefault();
				break;
			case "z":
				// console.log("z released");
				this.localws.sendMessage({ action: "input", origin: "leftPlayer", key: {"down": 0}});
				event.preventDefault();
				break;
			case "g":
				// console.log("g released");
				this.localws.sendMessage({ events: {fin: 1}});
				event.preventDefault();
				break;
		}
	};

	waitingScreen() {
		this.ctx.font = "30px Courier";
		this.ctx.fillStyle = "black";
		this.ctx.textAlign = "center";
		this.ctx.fillText("Waiting for an opponent", 250, 80);
	}

	opponent_disconnected() {
		this.ctx.font = "30px Courier";
		this.ctx.fillStyle = "black";
		this.ctx.textAlign = "center";
		this.ctx.fillText("Opponent disconnected", 250, 80);

	}
	//function to take into account the screen pixel ratio to avoid blurriness in the canvas
	setupHiPPICanvas(canvas) {
		const ratio = window.devicePixelRatio;
		const width = canvas.width;
		const height = canvas.height;
	
		canvas.width = width * ratio;
		canvas.height = height * ratio;
		canvas.style.width = width + "px";
		canvas.style.height = height + "px";
		canvas.getContext("2d").scale(ratio, ratio);
	}

  }
  
  customElements.define("onlinegame-creation", OnlineGameCreationElement);
  