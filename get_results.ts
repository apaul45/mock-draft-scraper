import { readFileSync, writeFile } from "fs";
import { Players, Simulation, getDraftOrder, getMostRecentResult, getTeams } from "./utils";
import { intersection } from "lodash";

async function gatherResults(simulations: Simulation[]) {
  const { reverseTeamsList } = getTeams();
  const draftOrder = await getDraftOrder(reverseTeamsList);
  const draftProspects: Players = JSON.parse(readFileSync("./utils/prospects.json", { encoding: "utf-8" }));

  // Add to the most recent result to prevent overcomputation
  const teamsList = getMostRecentResult();

  simulations.forEach((simulation) => {
    // Some sims return the team name rather than abbrev., so account for it
    simulation.pickedFor = reverseTeamsList[simulation.pickedFor || ""] || simulation.pickedFor;

    const players = simulation.players.map((player) => player.name);

    simulation.players.forEach(({ name, team }, index) => {
      // Some sims return the team name rather than abbrev., so account for it
      team = reverseTeamsList[team] || team;

      if (team == simulation.pickedFor) return;

      name += ` (${draftProspects[name]?.position ?? ""})`;

      const pickedPlayers = teamsList?.[team]?.[index + 1]?.["picked"] || {};

      const availablePlayers = players.slice(index + 1);
      const previousAvailablePlayers = teamsList?.[team]?.[index + 1]?.["availablePlayers"] || availablePlayers;

      teamsList[team] = {
        ...teamsList[team],
        [index + 1]: {
          picked: { ...pickedPlayers, [name]: 1 + (pickedPlayers[name] || 0) },
          availablePlayers: intersection(availablePlayers, previousAvailablePlayers),
          traded: draftOrder[index] !== team,
        },
      };
    });
  });

  console.log(`Processed ${simulations.length} simulations`);
  writeFile(`./results/${new Date().toISOString()}.json`, JSON.stringify(teamsList), (err: any) => {});
}

export default gatherResults;
