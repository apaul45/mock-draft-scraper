import { Simulation, Teams } from './';
import { intersection } from 'lodash';
import { getResources, Resources } from './resources';
import { DbSimulation, getDbs } from '../db';

let resources: Resources;

function processSimulation(simulation: Simulation, currentResult: Teams) {
  const { reverseTeamsList, draftOrder, draftProspects } = resources;

  // Some sims return the team name rather than abbrev., so account for it
  simulation.pickedFor =
    reverseTeamsList[simulation.pickedFor || ''] || simulation.pickedFor;

  const players = simulation.players.map((player) => player.name);

  simulation.players.forEach(({ name, team }, index) => {
    // Some sims return the team name rather than abbrev., so account for it
    team = reverseTeamsList[team] || team;

    if (simulation.pickedFor === team) return;

    name += ` (${draftProspects[name]?.position ?? ''})`;

    const pickObject = currentResult?.[team]?.[index + 1];

    const pickedPlayers = pickObject?.['picked'] || {};
    const availablePlayers = players.slice(index + 1);
    const previousAvailablePlayers =
      pickObject?.['availablePlayers'] || availablePlayers;

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
}

export async function gatherResults(simulations: DbSimulation[]) {
  if (!simulations.length) {
    console.log('No simulations to process');
    return;
  }

  const { SimulationsDb: simulationDb, ResultsDb: resultsDb } = await getDbs();

  resources = await getResources();
  const { teamsList } = resources;

  let result = teamsList;

  simulations.forEach((simulation) => processSimulation(simulation, result));

  await Promise.all([
    simulationDb.insertSimulations(simulations),
    resultsDb.addResults([{ result, date: new Date() }]),
  ]);
  console.log(`Added ${simulations.length} simulations`);
}
