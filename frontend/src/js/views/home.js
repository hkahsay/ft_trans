import "../components/counter.js";
import "../components/LoginIntra.js";


export default () => {


const htmlString = /* html */ `
 
    <section id="banner" class="position-relative">
        <div class="inner">

            <header>
                <h2>Welcome</h2>
            </header>
            <p>This is a <strong>Pong Game</strong>, Please signup or use your
            <br />
            intra login to register
            <br />
            <footer>
                <div class="col-md-auto"> 
                    <form class="container-fluid justify-content-end">
                        <a class="btn btn-outline-success rounded-pill me-2 login logged-out" type="button" id="btn-login-form"  href="/login" data-link>Login</a>
                    </form>
                </div>
            </footer>

        </div>

    </section>
`;
        return htmlString;
};


