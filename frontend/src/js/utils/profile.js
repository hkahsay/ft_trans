import { getUserData } from "../components/userUtils";

export function setupLocalStorageChangeListener() {
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
      if (event.detail.key === "picture") {
        const own_profile_picture = document.querySelectorAll(".own-profile-picture");
        own_profile_picture && own_profile_picture.forEach(picture => {
          picture.src = event.detail.value;
        });
      } else if (event.detail.key === "username") {
        const own_profile_username = document.querySelectorAll(".own-profile-username");
        own_profile_username && own_profile_username.forEach(username => {
          username.textContent = event.detail.value;
        });
      }
    });
  }
  
  
export async function initializeProfile() {
    const data = await getUserData();

    if (!data)
        return;

    for (const key of Object.keys(data))
    {
        console.log(key, data[key]);
        localStorage.setItem(key, `${data[key]}`)
    }

    if (Object.keys(data).includes('id42') && data["id42"])
    {
        const link = data['picture'].split('cdn.intra.42.fr/')[1];
        localStorage.setItem('picture', `https://cdn.intra.42.fr/${link}`);
    }
    else {
        localStorage.setItem("picture", `https://localhost:8080/api/${data['picture']}`)
    }
}

export function updateProfileElements() {
  const own_profile_picture = document.querySelectorAll(".own-profile-picture");
  own_profile_picture.forEach(picture => {
      picture.src = localStorage.getItem("picture");
  });

  const own_profile_username = document.querySelectorAll(".own-profile-username");
  own_profile_username.forEach(username => {
      username.textContent = localStorage.getItem("username");
  });
}