import puppeteer from "puppeteer-extra";
import { Simulation, fetchDraftOrder, getDraftProspects } from "./utils";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { writeFileSync, readdirSync, readFileSync } from "fs";
import { scrapers, Scrapers } from "./sites";
import { findKey, sortBy } from "lodash";
import { gatherResults } from "./get_results";

async function main() {
  const simulations: Simulation[] = [];

  puppeteer.use(StealthPlugin()).use(AdblockerPlugin({ blockTrackers: true }));

  const browser = await puppeteer.launch({
    headless: "new",
    args: [`--window-size=1920,1080`],
    defaultViewport: null,
  });

  for (const { name, scraper } of scrapers) {
    try {
      const page = await browser.newPage();

      console.log(`Starting ${name} Simulation...`);
      const start = Date.now();

      const result = await scraper(page);

      const totalTime = (Date.now() - start) / 60000;
      console.log(
        `${name} Simulation completed in: ${totalTime.toFixed(2)} mins \n`
      );

      const abbreviatedName = findKey(Scrapers, (el) => el === name);
      const currentDate = new Date().toISOString();

      writeFileSync(
        `./simulations/${abbreviatedName}_${currentDate}.json`,
        JSON.stringify(result)
      );
      simulations.push(result);
    } catch (e) {
      console.log(`${name} Simulation failed with error: ${e} \n`);
    }
  }

  await browser.close();

  await fetchDraftOrder();
  await gatherResults(simulations);
}

function getPlayerScores() {
  const draftProspects: { [player: string]: any } = getDraftProspects();

  const files = readdirSync("./simulations", { withFileTypes: true });

  files.forEach(({ name }) => {
    const simFile = readFileSync(`./simulations/${name}`, {
      encoding: "utf-8",
    });
    const simulation: Simulation = JSON.parse(simFile);

    simulation.players.forEach(({ name }, index) => {
      if (!draftProspects[name]) return;

      if (!draftProspects[name]["ADP"]) {
        draftProspects[name]["ADP"] = 0;
        draftProspects[name]["totalAppearances"] = 0;
      }

      draftProspects[name]["ADP"] += index + 1;
      draftProspects[name]["totalAppearances"] += 1;
    });
  });

  const prospectKeys = Object.keys(draftProspects).filter(
    (key) => draftProspects[key]?.totalAppearances === files.length
  );

  prospectKeys.forEach((key) => (draftProspects[key].ADP /= files.length));

  return sortBy(prospectKeys, (key) => draftProspects[key].ADP).map((name) => ({
    name,
    ...draftProspects[name],
  }));
}

main();
