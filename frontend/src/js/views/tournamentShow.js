import '../components/tournamentShow.js';

export default (id) => {
    return `<tournament-show tournament-id="${id}"/>`
};

// export default async (id) => {
//     const getTournamentIds = await getTournamentlist();
//     console.log("getTournamentIds", getTournamentIds);
//     // Extract only the IDs from the tournament list
//     const tournamentIds = getTournamentIds.map(tournament => tournament.id);
//     console.log("Tournament IDs:", tournamentIds);

//     // If you want to use a specific ID (the one passed as an argument)
//     if (tournamentIds.includes(parseInt(id))) {
//         return `<tournament-show tournament-id="${id}"/>`;
//     } else {
//         // If the ID doesn't exist in the list, you might want to handle this case
//         console.log("Tournament ID not found");
//         return `<div>Tournament not found</div>`;
//     }
// };