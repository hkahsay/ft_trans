// NOTE: This component should be removed once the official login page is implemented.
class LoginIntra extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = /* html */ `
            <button>Login with Intra</button>
        `;
        const btn = this.querySelector("button");
        btn.onclick = () => {
            console.log("Login with Intra");
            window.location.href = "https://localhost:8080/api/users/auth/authorize/"
        }
    }
}

customElements.define("login-intra", LoginIntra);

