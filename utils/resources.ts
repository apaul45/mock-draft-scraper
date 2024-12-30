import axios from 'axios';
import { load } from 'cheerio';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import Path from 'path';
import {
  getDraftYear,
  getMostRecentResult,
  inSeason,
  Players,
  serializeSimulation,
  Simulation,
  Teams,
  toTitleCase,
} from '.';

async function fetchDraftOrder() {
  const { reverseTeamsList: teams } = getTeams();

  const res = await axios.get('https://www.tankathon.com/nfl/full_draft', {
    responseType: 'document',
  });

  const html = load(res.data);

  const draftOrder = html('.team-link > a')
    .toArray()
    .map((el) => {
      const link = el.attribs['href'];
      const team = link.substring(link.lastIndexOf('/') + 1);

      return teams[toTitleCase(team)];
    });

  const draftYear = getDraftYear();
  writeFileSync(
    `./utils/${draftYear}/draftorder.json`,
    JSON.stringify(draftOrder)
  );

  return draftOrder;
}

async function fetchDraftProspects() {
  const draftYear = getDraftYear();

  const prospects: Players = {};

  // Get top 400 prospects
  for (let i = 1; i <= 4; i++) {
    const res = await axios.get(
      `https://www.drafttek.com/${draftYear}-NFL-Draft-Big-Board/Top-NFL-Draft-Prospects-2025-Page-${i}.asp`
    );

    const html = load(res.data);

    html('table.player-info > tbody')
      .children('tr')
      .slice(1) // Skip table header
      .each((_, el) => {
        const children: any = el.children;

        const [{ data: name }] = children[5].children;
        const [{ data: school }] = children[7].children;
        const [{ data: position }] = children[9].children;

        prospects[name] = { school, position };
      });
  }

  writeFileSync(
    `./utils/${draftYear}/prospects.json`,
    JSON.stringify(prospects)
  );

  return prospects;
}

export function getTeams() {
  const file = readFileSync('./utils/teams.json', { encoding: 'utf8' });
  const teamsList: Teams = JSON.parse(file);

  const reverseTeamsList = Object.fromEntries(
    Object.entries(teamsList).map(([key, value]) => {
      const fullName = value['fullName'];

      return [fullName.split(' ').pop(), key];
    })
  );

  return { teamsList, reverseTeamsList };
}

async function getDraftOrder() {
  const draftYear = getDraftYear();
  const draftOrderFilePath = `./utils/${draftYear}/draftorder.json`;

  // Fetch/refetch draft order during the season to account for changes
  if (inSeason() || !existsSync(draftOrderFilePath)) {
    return await fetchDraftOrder();
  }

  const file = readFileSync(draftOrderFilePath, { encoding: 'utf-8' });
  return JSON.parse(file);
}

async function getDraftProspects(): Promise<Players> {
  const currentYear = getDraftYear();
  const prospectsFilePath = `./utils/${currentYear}/prospects.json`;

  if (!existsSync(prospectsFilePath)) {
    return await fetchDraftProspects();
  }

  const file = readFileSync(prospectsFilePath, { encoding: 'utf-8' });
  return JSON.parse(file);
}

export function getSimulations() {
  const fileNames = readdirSync('./simulations');

  const simulations = fileNames.map((fileName) => {
    const fileNameWithoutExt = Path.parse(fileName).name;
    const [scraperName, fileDate] = fileNameWithoutExt.split('_');

    const data = readFileSync(`./simulations/${fileName}`, {
      encoding: 'utf8',
    });
    const simulation: Simulation = JSON.parse(data);

    return {
      scraperName,
      date: fileDate,
      ...serializeSimulation(simulation),
    };
  });

  return simulations;
}

export function getResults() {
  const fileNames = readdirSync('./results');

  const results = fileNames.map((fileName) => {
    const fileNameWithoutExt = Path.parse(fileName).name;
    const data = readFileSync(`./results/${fileName}`, { encoding: 'utf8' });
    const result = JSON.parse(data);

    return {
      result,
      date: new Date(fileNameWithoutExt).toISOString(),
    };
  });

  return results;
}

export type Resources = {
  teamsList: Teams;
  reverseTeamsList: Record<string, string>;
  draftOrder: string[];
  draftProspects: Players;
};
export async function getResources(): Promise<Resources> {
  const [draftOrder, draftProspects] = await Promise.all([
    getDraftOrder(),
    getDraftProspects(),
  ]);

  return {
    ...getTeams(),
    draftOrder,
    draftProspects,
  };
}
