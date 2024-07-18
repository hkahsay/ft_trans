
const navbarItems = ["Home", "Game", "Tournament", "About"];

function createNavbar() {
  return navbarItems
    .map(
      (item) => `
      <li class="nav-item nav_list">
        <a class="nav-link logged-in" aria-current="page" href="${"/" + item.toLowerCase()}" data-link>${item}</a>
      </li>
      `
    )
    .join("");
}
function profile_picture() {

  // Custom event to notify changes
  function notifyLocalStorageChange(key, value) {
    const event = new CustomEvent('localStorageChange', {
      detail: { key, value }
    });
    window.dispatchEvent(event);
  }

  // Override setItem method
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    notifyLocalStorageChange(key, value);
  };

  // Listen for custom events
  window.addEventListener('localStorageChange', (event) => {
    if (event.detail.key === "picture")
    {
      const own_profile_picture = document.querySelectorAll(".own-profile-picture");
      own_profile_picture && own_profile_picture.forEach(picture => {
        picture.src = event.detail.value;
      })

    }
    else if(event.detail.key === "username") {
      const own_profile_username = document.querySelectorAll(".own-profile-username");
      own_profile_username && own_profile_username.forEach(username => {
        username.textContent = event.detail.value;
      })
    }
  });

  return `
    <a class="navbar-brand logged-in dropdown-toggle" id="profileDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        <div class="profile-picture me-3">
          <img class="shadow own-profile-picture" src="${localStorage.getItem("picture")}" width="50" alt="profile_pic" />
        </div>
        <h3 id="profileUserName" class=" own-profile-username text-white me-3">${localStorage.getItem("username")}</h3>
    </a>
  `;
}


export default async function navbar() { 
  return /* html */ `
  <nav class="navbar navbar-expand-sm">
    <div class="container-fluid">
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" 
      data-bs-target="#navbarExample" aria-controls="navbarExample" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <a class="navbar-brand" href="/home">
        <img src="/media/bh.gif" width="50" alt="animated blackhole" class="rounded-circle border border-light" data-link>
      </a>
      <div class="collapse navbar-collapse" id="navbarExample">
        <ul class="navbar-nav me-auto mb-0">
          ${createNavbar()}
        </ul>
        <div class="d-flex align-items-center flex-row flex-lg-row">
          <div class="dropdown">
            ${profile_picture()} 
            
            <ul class="dropdown-menu" aria-labelledby="profileDropdown">
              <li class="dropdown-item">
                <a class="dropdown-item link-success" id="btn-profile" href="/profile" data-link>Profile
                  <div class="profile-picture me-3">
                    <img class="shadow own-profile-picture" src="${localStorage.getItem("picture")}" width="50" alt="profile_pic" />
                  </div>
                  <h3 id="profileUserName" class="own-profile-username me-3">${localStorage.getItem("username")}</h3>
                </a>
              </li>
              <li class="dropdown-item">
                <a class="dropdown-item link-success" id="btn-add" href="/friends" data-link>AddFriend</a>
              </li>
              <li class="dropdown-item">
                <a class="dropdown-item link-success" id="btn-chat" href="/chat" data-link>chat</a>
              </li>
              <li class="dropdown-item">
              <a class="dropdown-item link-danger logged-in" id="btn-logout" href="/logout" data-link>Logout</a>
              </li>
            </ul>
          </div>
          <a class="btn btn-link logged-out" id="btn-signup" href="/signup" data-link>Sign up</a>
          <a class="btn btn-primary logged-out" id="btn-login-form"  href="/login" data-link>Login</a>
          <a class="btn btn-secondary logged-out" id="btn-login-intra"  href="https://localhost:8080/api/users/auth/authorize/">Login Intra 42</a>
        </div>
      </div>
    </nav>
  `;
};


