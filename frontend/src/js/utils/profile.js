import { getUserData } from "../components/userUtils";

export async function initializeProfile() {
    const data = await getUserData();

    for (const key of Object.keys(data))
        localStorage.setItem(key, data[key])

    if (data['id42'])
    {
        const link = data['picture'].split('cdn.intra.42.fr/')[1];
        localStorage.setItem('picture', `https://cdn.intra.42.fr/${link}`);
        console.log('id42', id42);
    }
}