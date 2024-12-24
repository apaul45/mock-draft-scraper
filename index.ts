import puppeteer from "puppeteer-extra";
import { Simulation } from "./utils";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { writeFileSync } from "fs";
import { scrapers, Scrapers } from "./sites";
import { findKey } from "lodash";
import { gatherResults } from "./get_results";
import { fetchDraftOrder, fetchDraftProspects } from "./utils/resources";

async function main() {
  await fetchDraftOrder();
  await fetchDraftProspects();

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

  await gatherResults(simulations);
}

main();
