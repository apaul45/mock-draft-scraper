import axios from "axios";
import { load } from "cheerio";
import { existsSync, readFileSync, writeFileSync } from "fs";
import {
  getCurrentYear,
  getMostRecentResult,
  Players,
  Teams,
  toTitleCase,
} from ".";

async function fetchDraftOrder() {
  const { reverseTeamsList: teams } = getTeams();

  const res = await axios.get("https://www.tankathon.com/nfl/full_draft", {
    responseType: "document",
  });

  const html = load(res.data);

  const draftOrder = html(".team-link > a")
    .toArray()
    .map((el) => {
      const link = el.attribs["href"];
      const team = link.substring(link.lastIndexOf("/") + 1);

      return teams[toTitleCase(team)];
    });

  const currentYear = getCurrentYear();
  writeFileSync(
    `./utils/${currentYear}/draftorder.json`,
    JSON.stringify(draftOrder)
  );

  return draftOrder;
}

async function fetchDraftProspects() {
  const currentYear = getCurrentYear();

  const prospects: Players = {};

  // Get top 400 prospects
  for (let i = 1; i <= 4; i++) {
    const res = await axios.get(
      `https://www.drafttek.com/${currentYear}-NFL-Draft-Big-Board/Top-NFL-Draft-Prospects-2025-Page-${i}.asp`
    );

    const html = load(res.data);

    html("table.player-info > tbody")
      .children("tr")
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
    `./utils/${currentYear}/prospects.json`,
    JSON.stringify(prospects)
  );

  return prospects;
}

function getTeams() {
  const file = readFileSync("./utils/teams.json", { encoding: "utf8" });
  const teamsList: Teams = JSON.parse(file);

  const reverseTeamsList = Object.fromEntries(
    Object.entries(teamsList).map(([key, value]) => {
      const fullName = value["fullName"];

      return [fullName.split(" ").pop(), key];
    })
  );

  return { teamsList, reverseTeamsList };
}

async function getDraftOrder() {
  const hasResultWithinDay = !!getMostRecentResult(1);

  const currentYear = getCurrentYear();
  const draftOrderFilePath = `./utils/${currentYear}/draftorder.json`;

  // Fetch/refetch draft order if results haven't been captured in some time
  // or the file doesn't exist
  if (!hasResultWithinDay || !existsSync(draftOrderFilePath)) {
    return await fetchDraftOrder();
  }

  const file = readFileSync(draftOrderFilePath, { encoding: "utf-8" });
  return JSON.parse(file);
}

async function getDraftProspects(): Promise<Players> {
  const currentYear = getCurrentYear();
  const prospectsFilePath = `./utils/${currentYear}/prospects.json`;

  if (!existsSync(prospectsFilePath)) {
    return await fetchDraftProspects();
  }

  const file = readFileSync(prospectsFilePath, { encoding: "utf-8" });
  return JSON.parse(file);
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
