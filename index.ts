import { writeFileSync, readdirSync, readFileSync } from "fs";
import { Simulation, getTeams } from "./utils";
import { scrapers, Scrapers } from "./sites";
import puppeteer from "puppeteer";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import { fetch } from "cross-fetch";
import { findKey } from "lodash";
import gatherResults from "./get_results";

async function main() {
  const simulations: Simulation[] = [];

  const browser = await puppeteer.launch({ headless: "new", args: [`--window-size=1920,1080`], defaultViewport: null });
  const adBlocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);

  for (const { name, scraper } of scrapers) {
    try {
      const page = await browser.newPage();
      await adBlocker.enableBlockingInPage(page);

      console.log(`Starting ${name} Simulation...`);
      const start = Date.now();

      const result = await scraper(page);

      const totalTime = (Date.now() - start) / 60000;
      console.log(`${name} Simulation completed in: ${totalTime.toFixed(2)} mins \n`);

      const abbreviatedName = findKey(Scrapers, (el) => el === name);
      const currentDate = new Date().toISOString();

      writeFileSync(`./simulations/${abbreviatedName}_${currentDate}.json`, JSON.stringify(result));
      simulations.push(result);
    } catch (e) {
      console.log(`${name} Simulation failed with error: ${e} \n`);
    }
  }

  await browser.close();

  await gatherResults(simulations);
}

main();
