import home from "./views/home.js";
import game from "./views/game.js";
import chat from "./views/chat.js";
import about from "./views/about.js";
import profile from "./views/profile.js";
import tournament from "./views/tournament.js";
import login from "./views/login.js";
import signup from "./views/signup.js";
import logout from "./views/logout.js";
import friends from "./views/friends.js";


import navbar from "./components/navbar.js";
import IntraCallback from "./views/IntraCallback.js";
import "../styles/styles.scss";
import "../styles/styles.css";
import { ChatArea } from "./components/ChatArea.js";
import { initializeSession } from "./utils/session.js";
import { initializeProfile } from "./utils/profile.js";



function routes(path) {
  const parts = path.substring(1).split('/');
  switch (parts[0]) {
    case "": return { title: "Home", render: home }
    case "game": return { title: "Game", render: game }
    case "chat": return { title: "Chat", render: chat }
    case "about": return { title: "About", render: about }
    case "profile":
      const username = parts[1]
      return { title: "Profile", render: () => profile(username), async: true }
    case "tournament": return { title: "Tournament", render: tournament }
    case "auth": 
    if (parts[1] === "callback") {
      return { title: "Redirect", render: IntraCallback };
    } else {
      return undefined;
    }
    case "login": return { title: "Login", render: login }
    case "signup": return { title: "Signup", render: signup }
    case "logout": return { title: "Logout", render: logout }
    case "friends": return { title: "Friends", render: friends }
    default: return undefined
  }
}


customElements.define('chat-area', ChatArea);

initializeSession().then();
// initializeProfile().then();

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}


async function router() {
  const view = routes(location.pathname);
  // eslint-disable-next-line
  nav.innerHTML = await navbar();
  if (view) {
    document.title = view.title;
    // eslint-disable-next-line
    if(view.async) {
      const content = await view.render();
      app.innerHTML = content;
    } else {
      app.innerHTML = view.render();
    }
    if (view.afterRender){
      view.afterRender();
    }
  } else {
    history.replaceState("", "", "/");
    router();
  }

  let cookie = getCookie("logged")
  if(cookie === "1") {
      document.querySelectorAll('.logged-in').forEach(elem => elem.style.display = 'block');
      document.querySelectorAll('.logged-out').forEach(elem => elem.style.display = 'none');
  } else {
      document.querySelectorAll('.logged-in').forEach(elem => elem.style.display = 'none');
      document.querySelectorAll('.logged-out').forEach(elem => elem.style.display = 'block');
  }
}

// Handle navigation
window.addEventListener("click", (e) => {
  let clic_target = e.target;
  if (clic_target.matches("[data-link]")) {
    e.preventDefault();
    if (clic_target.nodeName === "IMG") clic_target = clic_target.parentElement;
    history.pushState("", "", clic_target.href);
    router();
  }
});

// Update router
window.addEventListener("popstate", router);
window.addEventListener("DOMContentLoaded", router);
