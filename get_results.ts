import { writeFile } from "fs";
import {
  Players,
  Simulation,
  Teams,
  getDraftOrder,
  getDraftProspects,
  getMostRecentResult,
  getMostRecentSimulations,
  getTeams,
} from "./utils";
import { intersection } from "lodash";

function processSimulation({
  simulation,
  reverseTeamsList,
  draftProspects,
  draftOrder,
  teamsList,
}: {
  simulation: Simulation;
  reverseTeamsList: any;
  draftProspects: Players;
  draftOrder: any[];
  teamsList: Teams;
}) {
  // Some sims return the team name rather than abbrev., so account for it
  simulation.pickedFor =
    reverseTeamsList[simulation.pickedFor || ""] || simulation.pickedFor;

  const players = simulation.players.map((player) => player.name);

  simulation.players.forEach(({ name, team }, index) => {
    // Some sims return the team name rather than abbrev., so account for it
    team = reverseTeamsList[team] || team;

    if (simulation.pickedFor === team) return;

    name += ` (${draftProspects[name]?.position ?? ""})`;

    const pickObject = teamsList?.[team]?.[index + 1];

    const pickedPlayers = pickObject?.["picked"] || {};
    const availablePlayers = players.slice(index + 1);
    const previousAvailablePlayers =
      pickObject?.["availablePlayers"] || availablePlayers;

    teamsList[team] = {
      ...teamsList[team],
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

  return teamsList;
}

async function gatherResultsFromScratch() {
  let { teamsList, reverseTeamsList } = getTeams();
  const draftOrder = await getDraftOrder(reverseTeamsList);
  const draftProspects = getDraftProspects();

  const simulations = getMostRecentSimulations();

  if (!simulations.length) return;

  simulations.forEach(
    (simulation) =>
      (teamsList = processSimulation({
        simulation,
        reverseTeamsList,
        draftProspects,
        draftOrder,
        teamsList,
      }))
  );

  console.log(`Processed ${simulations.length} files`);
  writeFile(
    `./results/${new Date().toISOString()}.json`,
    JSON.stringify(teamsList),
    (err: any) => {}
  );
}

async function gatherResults(simulations: Simulation[]) {
  // Add to the most recent result to prevent overcomputation
  let teamsList = getMostRecentResult();

  // If most recent result is too old, build new result from scratch
  if (!teamsList) {
    console.log("Creating new result from scratch...");
    await gatherResultsFromScratch();
    return;
  }

  // Prevent creation of duplicate result
  if (!simulations.length) return;

  const { reverseTeamsList } = getTeams();
  const draftProspects = getDraftProspects();
  const draftOrder = await getDraftOrder(reverseTeamsList);

  simulations.forEach(
    (simulation) =>
      (teamsList = processSimulation({
        simulation,
        draftOrder,
        draftProspects,
        teamsList: teamsList as Teams,
        reverseTeamsList,
      }))
  );

  console.log(`Added ${simulations.length} simulations`);
  writeFile(
    `./results/${new Date().toISOString()}.json`,
    JSON.stringify(teamsList),
    (err: any) => {}
  );
}

export default gatherResults;
