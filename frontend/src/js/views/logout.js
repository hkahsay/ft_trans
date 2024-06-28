export default () => {
    fetch('https://localhost:8080/api/users/auth/logout/', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
        .then(result => {
            console.log(result.body); //debug
            localStorage.removeItem('picture');
            localStorage.removeItem('username');
            if (result.status >= 200 && result.status < 300) {
                window.location.href = '/';
            } else {
                alert('Error logout : ' + result.body.error);
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during logout. Please try again.');
        });

    return /* html */ `
        <div class="alert alert-primary" role="alert">
            <h3>logging out</h3>
        </div>
    `;
};
