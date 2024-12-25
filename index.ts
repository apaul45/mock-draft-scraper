import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockerPlugin from "puppeteer-extra-plugin-adblocker";
import { Cluster } from "puppeteer-cluster";
import { Page } from "puppeteer";
import { Simulation } from "./utils";
import { writeFileSync } from "fs";
import { scrapers, Scrapers } from "./sites";
import { findKey } from "lodash";
import { gatherResults } from "./utils/get_results";

async function main() {
  const simulations: Simulation[] = [];

  puppeteer.use(StealthPlugin()).use(AdblockerPlugin({ blockTrackers: true }));

  const cluster = await Cluster.launch({
    maxConcurrency: scrapers.length,
    puppeteer,
    puppeteerOptions: {
      headless: true,
      args: [`--window-size=1920,1080`],
      defaultViewport: null,
    },
    timeout: 600000,
    retryLimit: 1,
  });

  scrapers.forEach(({ name, scraper }) =>
    cluster.queue(async ({ page }: { page: Page }) => {
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
    })
  );

  await cluster.idle();
  await cluster.close();

  await gatherResults(simulations);
}

main();
