import { readFileSync, writeFile, writeFileSync, readdirSync } from "fs";
import { Player, Players, Teams, getDraftOrder, getTeams } from "./utils";
import { intersection, findKey } from "lodash";
import { scrapers, Scrapers } from "./sites";
import puppeteer from "puppeteer";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import { fetch } from "cross-fetch";

function gatherResults(teamsList: Teams, draftOrder: string[]) {
  const draftProspects: Players = JSON.parse(readFileSync("./utils/prospects.json", { encoding: "utf-8" }));
  const fileNames = readdirSync("./simulations", { withFileTypes: true });

  fileNames.forEach(({ name }) => {
    let data = readFileSync(`./simulations/${name}`, { encoding: "utf8" });
    const players: Player[] = JSON.parse(data);

    players.forEach(({ name, team }, index) => {
      if (draftOrder[index] != team) return;

      if (draftProspects[name]) name += ` (${draftProspects[name].position})`;

      const pickedPlayers = teamsList?.[team]?.[index + 1]?.["picked"] || {};

      const availablePlayers = players.slice(index + 1).map((el) => el.name);
      const previousAvailablePlayers = teamsList?.[team]?.[index + 1]?.["availablePlayers"] || availablePlayers;

      teamsList[team] = {
        ...teamsList[team],
        [index + 1]: {
          picked: { ...pickedPlayers, [name]: 1 + (pickedPlayers[name] || 0) },
          availablePlayers: intersection(availablePlayers, previousAvailablePlayers),
        },
      };
    });
  });

  console.log(`Processed ${fileNames.length} files`);
  writeFile(`./results/${new Date().toISOString()}.json`, JSON.stringify(teamsList), (err: any) => {});
}

async function main() {
  const { teamsList, reverseTeamsList } = getTeams();

  const browser = await puppeteer.launch({ headless: "new", args: [`--window-size=1920,1080`], defaultViewport: null });
  const adBlocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);

  for (const { name, scraper } of scrapers) {
    try {
      const page = await browser.newPage();
      await adBlocker.enableBlockingInPage(page);

      console.log(`Starting ${name} Simulation...`);
      const start = Date.now();

      const result = await scraper(page, reverseTeamsList);

      const totalTime = (Date.now() - start) / 60000;
      console.log(`${name} Simulation completed in: ${totalTime.toFixed(2)} mins \n`);

      const abbreviatedName = findKey(Scrapers, (el) => el === name);
      const currentDate = new Date().toISOString();

      writeFileSync(`./simulations/${abbreviatedName}_${currentDate}.json`, JSON.stringify(result));
    } catch (e) {
      console.log(`${name} Simulation failed with error: ${e} \n`);
    }
  }

  await browser.close();

  const draftOrder = await getDraftOrder(reverseTeamsList);
  gatherResults(teamsList, draftOrder);
}

main();
