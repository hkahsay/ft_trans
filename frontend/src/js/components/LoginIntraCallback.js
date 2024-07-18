import { navigate } from "../main";

class LoginIntraCallback extends HTMLElement {
    constructor() {
        console.log("CAllback api")
        super();
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code === null) {
            console.error("No code in URL");
            return;
        }
        fetch(
            `https://localhost:8080/api/users/auth/callback/?code=${code}`, {
                method: "GET",
                headers: {
                    "accept": "application/json",
                },
                credentials: 'include'
            }
        )
        .then(response => response.json())
        .then(
            data => {
                if (data.error) {
                    console.error(data.error);
                    return;
                }

                localStorage.setItem('username', data.username);
                navigate('/');
            }
        )
    }
}

customElements.define("login-intra-callback", LoginIntraCallback);