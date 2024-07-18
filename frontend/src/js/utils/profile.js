import { getUserData } from "../components/userUtils";

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