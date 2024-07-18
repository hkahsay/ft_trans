import "../components/loginForm.js";
import { navigate } from "../main.js";

export default () => /* html */ `
    <div class="alert alert-primary" role="alert">
        <div class="container mt-5">
        <h1>Login</h1>
        <login-form></login-form>
        <br>
        <a>Don't have an account yet ? 
            <a class="link-primary" href="/signup" data-link>sign-up</a>
        </a>
        </div>
    </div>
`;

// Listen for the custom event
document.addEventListener('loginButtonClick', () => {
    // Navigate to the login view or trigger login functionality
    navigate("path/to/login");
});
