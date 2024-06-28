class Counter extends HTMLElement {
  constructor() {
    super();

    this.innerHTML = /* html */ `
            <button>Are you connected ?</button>
        `;

    const btn = this.querySelector("button");

    // example of using auth get user API
    btn.onclick = () => {
      fetch("https://localhost:8080/api/users/me/data", {
        method: "GET",
        credentials: "include",
      })
          .then(response => {
              if (response.status === 401) {
                  alert("You are not logged in.");
                  return;
              }
              if (!response.ok) {
                  throw new Error(`Could not fetch user data. Code: ${response.status}`);
              }
              return response.json();
           })
          .then(data => {
              if (!data)
                  return; // If there's no data (401 case), stop here.

              console.log('Data:', data); //debug
              alert("User " + data.username + " is connected")
          })
          .catch(error => {console.error('Error:', error);});
    };
  }
}

customElements.define("click-counter", Counter);
