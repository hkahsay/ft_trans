class SignupForm extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = /* html */ `
        
        <form id="signupForm" class="needs-validation" novalidate autocomplete="on">
            <div class="form-group">
                <label for="username">Username:</label>
                <input type="text" class="form-control" id="username" name="username" autocomplete="username" required>
                <div class="invalid-feedback">
                    Please choose a username.
                </div>
            </div>

            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" class="form-control" id="password" name="password" autocomplete="new-password" required>
                <div class="invalid-feedback">
                    Please enter a password.
                </div>
            </div>
            <div class="form-group">
                <label for="formFile" class="form-label">Profile Picture:</label>
                <input class="form-control" type="file" id="picture">
            </div>
            <br>
            <button type="submit" class="btn btn-primary">Signup</button>
        </form>
            
        `;
        const form = this.querySelector('#signupForm');
        console.log(form);
        form.addEventListener('submit', this.handleSignup.bind(this));
    }

    handleSignup(event) {
        event.preventDefault();
        const formData = new FormData();
        formData.append('username', document.getElementById('username').value);
        formData.append('password', document.getElementById('password').value);

        formData.append('picture', document.getElementById('picture').files[0]);

        fetch('https://localhost:8080/api/users/auth/signup/', {

            method: 'POST',
            credentials: 'include',
            body: formData,
        })
        .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(result => {
            if (result.status >= 200 && result.status < 300) {
                alert(result.body.message);
                window.location.href = '/';
            } else {
                alert('Error Sign-up : ' + result.body.error);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during signup. Please try again.');
        });
    }
}

customElements.define('signup-form', SignupForm);
