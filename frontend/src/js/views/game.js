export default () => /* html */ `
    <h1 class="text-center">Game</h1>
    <section>

        <div class="container rounded">
            <div class="row">
                <div class="col-md-6">
                    <div class="container-fluid bg-light p-4 position-relative">
                    <!-- Container for the first section -->
                        <div class="bg-primary">
                          
                        </div> 
                        <div id="buttons" class="button-container top-50 start-50 d-flex justify-content-center align-items-center">
                            <!-- Button container -->
                            <a class="btn btn-success rounded me-4 login" type="button" id="btn-local-player" href="#" data-link>Local Player</a>
                            <a class="btn btn-success rounded ms-4 login" type="button" id="btn-remote-player" href="#" data-link>Remote Player Game</a>
                        </div>
                        
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="container-fluid bg-light p-4">
                    <a class="btn btn-success rounded me-2 login" type="button" id="btn-login-form"  href="#" data-link>Create Tournament</a>
    
                    </div>
                </div>
            </div>
        </div>
    </section>
<!-- </div> -->
`;
const game = document.getElementById("btn-local-player");