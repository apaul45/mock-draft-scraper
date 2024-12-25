import { writeFile, readdirSync } from "fs";
import {
  Simulation,
  Teams,
  getMostRecentResult,
  getMostRecentSimulations,
} from "./";
import { intersection } from "lodash";
import { getResources, Resources } from "./resources";

let resources: Resources;

function processSimulation(simulation: Simulation, currentResult: Teams) {
  const { reverseTeamsList, draftOrder, draftProspects } = resources;

  // Some sims return the team name rather than abbrev., so account for it
  simulation.pickedFor =
    reverseTeamsList[simulation.pickedFor || ""] || simulation.pickedFor;

  const players = simulation.players.map((player) => player.name);

  simulation.players.forEach(({ name, team }, index) => {
    // Some sims return the team name rather than abbrev., so account for it
    team = reverseTeamsList[team] || team;

    if (simulation.pickedFor === team) return;

    name += ` (${draftProspects[name]?.position ?? ""})`;

    const pickObject = currentResult?.[team]?.[index + 1];

    const pickedPlayers = pickObject?.["picked"] || {};
    const availablePlayers = players.slice(index + 1);
    const previousAvailablePlayers =
      pickObject?.["availablePlayers"] || availablePlayers;

    currentResult[team] = {
      ...currentResult[team],
      [index + 1]: {
        picked: { ...pickedPlayers, [name]: 1 + (pickedPlayers[name] || 0) },
        availablePlayers: intersection(
          availablePlayers,
          previousAvailablePlayers
        ),
        traded: draftOrder[index] !== team,
      },
    };
  });

  return currentResult;
}

export async function gatherResults(simulations: Simulation[]) {
  resources = await getResources();
  const { teamsList } = resources;

  // Add to the most recent result to prevent overcomputation
  let result = getMostRecentResult();

  // If most recent result is too old, build new result from scratch
  if (!result) {
    result = teamsList;
    simulations = getMostRecentSimulations();
  }

  // Prevent creation of duplicate result
  if (!simulations.length) return;

  simulations.forEach(
    (simulation) => (result = processSimulation(simulation, result as Teams))
  );

  console.log(`Added ${simulations.length} simulations`);

  // Write same day sims to the same result
  const resultToday = getMostRecentResult(1);
  const fileName = resultToday
    ? readdirSync("./results").slice(-1)[0]
    : `${new Date().toISOString()}.json`;

  writeFile(`./results/${fileName}`, JSON.stringify(result), (err: any) => {});
}
