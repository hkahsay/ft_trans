import { navigate } from "../main";

class LoginForm extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = /* html */ `
            
        <form id="loginForm" method="post" action="/your-endpoint/">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" class="form-control" id="username" name="username" required>
            </div>
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" class="form-control" id="password" name="password" required>
            </div>
            <br>
            
            <button type="submit" class="btn btn-primary">Login</button>
        </form>

        `;
        const form = this.querySelector('#loginForm');
        form.addEventListener('submit', this.handleLogin.bind(this));
         
    }

    handleLogin(event) {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch('https://localhost:8080/api/users/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
        },
            credentials: 'include',
            body: JSON.stringify({
                username: username,
                password: password,
            }),
        })
        .then(response => response.json().then(data => ({ status: response.status, data: data })))
        .then(result => {
            if (result.status >= 200 && result.status < 300) {
                localStorage.setItem('username', result.data.username);
                localStorage.setItem('picture', result.data.picture);
               
                alert("login successful, welcome " + result.data.username + "." );
                navigate('/');
            } else {
                alert('Error Login : ' + result.data.error);

            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during login. Please try again.');
        });
    }
}

customElements.define('login-form', LoginForm);
