import "../components/signupForm.js";

export default () => /* html */ `
    <div class="alert alert-primary" role="alert">
        <div class="container mt-5">
            <h1>Create Account</h1>
            <signup-form></signup-form>
            <br>
            <a>Already have an account ?
            <a class="link-primary" href="/login" data-link>login</a>
            </a>
        </div>
    </div>
`;
