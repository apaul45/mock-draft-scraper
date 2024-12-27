import { Simulation, Teams } from './';
import { intersection } from 'lodash';
import { getResources, Resources } from './resources';
import { DbSimulation, initializeDb, ResultsDb, SimulationsDb } from '../db';

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

  return currentResult;
}

export async function gatherResults(simulations: DbSimulation[]) {
  const db = await initializeDb();
  const simulationDb = new SimulationsDb(db);
  const resultsDb = new ResultsDb(db);

  resources = await getResources();
  const { teamsList } = resources;

  // Add to the most recent result to prevent overcomputation
  const lastResult = await resultsDb.getMostRecentResult();
  let result = lastResult?.result;

  // If most recent result is too old, build new result from scratch
  if (!result) {
    result = teamsList;
    simulations = await simulationDb.getMostRecentSimulations();
  }

  if (!simulations.length) {
    console.log('No simulations to process');
    return;
  }

  simulations.forEach(
    (simulation) => (result = processSimulation(simulation, result as Teams))
  );

  const updates = [
    simulationDb.insertSimulations(simulations),
    lastResult
      ? resultsDb.updateResult({ ...lastResult, result })
      : resultsDb.insertResults([{ result }]),
  ];

  await Promise.all(updates);

  console.log(`Added ${simulations.length} simulations`);
}
