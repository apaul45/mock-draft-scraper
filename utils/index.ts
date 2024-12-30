import { readFileSync, readdirSync } from 'fs';
import Path from 'path';
import { getTeams } from './resources';

enum Positions {
  Quarterback = 'QB',
  RunningBack = 'HB',
  WideReceiver = 'WR',
  TightEnd = 'TE',
  OTackle = 'T',
  Center = 'C',
  Guard = 'G',
  DTackle = 'DT',
  EdgeRusher = 'ED',
  DefensiveEnd = 'DE',
  Safety = 'S',
  Cornerback = 'CB',
  Linebacker = 'LB',
}

type Teams = { [key: string]: any };
type Players = { [player: string]: { school: string; position: string } };

type Player = {
  name: string;
  team: string;
};

type Simulation = {
  pickedFor?: string;
  players: Player[];
};

interface ProspectsWithADP extends Player {
  ADP?: number;
}

// General utils
function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      return word.replace(word[0], word[0].toUpperCase());
    })
    .join(' ');
}

function removeParanthesis(str: string) {
  return str.replace(/[\])}[{(]/g, '');
}

function getDraftYear() {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Draft cycle ends in April/May, so use next years if after
  return currentMonth > 5 ? currentYear + 1 : currentYear;
}

function inSeason() {
  const draftYear = getDraftYear();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Season is from September to February
  return currentYear < draftYear || currentMonth <= 2;
}

function isDateWithin(date: Date, range: number) {
  const today = new Date();

  const start = new Date(today);
  start.setDate(today.getDate() - range);

  return date >= start && date <= today;
}

// Only use results from within certain time period
function getMostRecentResult(range: number = 7): Teams | undefined {
  const [mostRecentResult] = readdirSync('./results').slice(-1);

  // Result files formatted as {date as iso string}.json
  const fileNameWithoutExt = Path.parse(mostRecentResult ?? '')?.name;

  if (!isDateWithin(new Date(fileNameWithoutExt), range)) return;

  const file = readFileSync(`./results/${mostRecentResult}`, {
    encoding: 'utf8',
  });
  return JSON.parse(file);
}

// Only get sims from within certain time period
function getMostRecentSimulations(range: number = 30): Simulation[] {
  const fileNames = readdirSync('./simulations');

  return fileNames
    .filter((fileName) => {
      const fileNameWithoutExt = Path.parse(fileName).name;
      const fileDate = fileNameWithoutExt.split('_')[1];

      return isDateWithin(new Date(fileDate), range);
    })
    .map((fileName) => {
      const data = readFileSync(`./simulations/${fileName}`, {
        encoding: 'utf8',
      });
      return JSON.parse(data);
    });
}

function serializeSimulation(simulation: Simulation): Simulation {
  const { reverseTeamsList } = getTeams();
  const { players, pickedFor } = simulation;

  // Some sims return full team name rather than abbrev., so account for it
  const formattedPlayers = players.map((player) => {
    return {
      ...player,
      team: reverseTeamsList[player.team] || player.team,
    };
  });
  const formattedPickedFor = reverseTeamsList[pickedFor ?? ''] || pickedFor;

  return {
    players: formattedPlayers,
    pickedFor: formattedPickedFor,
  };
}

export {
  Positions,
  Teams,
  Players,
  Player,
  Simulation,
  ProspectsWithADP,
  toTitleCase,
  removeParanthesis,
  getDraftYear,
  inSeason,
  getMostRecentResult,
  getMostRecentSimulations,
  serializeSimulation,
};
