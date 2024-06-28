import "../components/profilepage.js";
import { getUserData } from "../components/userUtils.js";
// export default async (username) => {
//   if (!username) {
//     // Fetch the current user's data if username is not provided
//     const currentUser = await getUserData();
//     username = currentUser.username; 
//     console.log("username", username);
//   }
//   return /* html */ `
//   <profile-page username="${username}"></profile-page>
// `;
// };


export default async (username) => {
  if (!username) {
    // Fetch the current user's data if username is not provided
    const currentUser = await getUserData();
    username = currentUser.username;
  }
  return /* html */ `
    <profile-page username="${username}"></profile-page>
  `;
};

