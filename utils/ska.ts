import puppeteer from "puppeteer";
import { Player } from ".";
import { load } from "cheerio";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import fetch from "cross-fetch";
import { writeFileSync } from "fs";

async function scrape() {
  const draft: Player[] = [];

  const browser = await puppeteer.launch({ headless: "new", args: [`--window-size=1920,1080`], defaultViewport: null });
  const page = await browser.newPage();

  const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
  await blocker.enableBlockingInPage(page);

  await page.goto("https://www.sportskeeda.com/nfl/mock-draft-simulator");

  await page.waitForSelector(".team-selection-container");
  await page.click("[data-shortname='KC']"); // Can't auto draft so choose team w/least picks (chiefs)
  await page.click("#seven");
  await page.click("#fast");

  await page.click(".start-draft-btn");
  await page.waitForSelector(".draft-simulation-container", { visible: true });

  await page.click(".my-picks-btn");
  await page.waitForSelector(".mypicks-container", { visible: true });

  const numberOfPicks = (await page.$$(".single-pick")).length;

  // @ts-ignore
  await page.$eval(".resume-draft", (el) => (el ? el.click() : el));

  for (let i = 0; i < numberOfPicks; i++) {
    await page.waitForSelector(".add-player", { visible: true });

    // @ts-ignore
    await page.$eval(".add-player", (el) => el.click());
  }

  await page.waitForSelector(".result-btn", { visible: true });
  await page.click(".result-btn");

  await page.waitForSelector("[data-shortname='full_result']", { visible: true });

  for (let i = 1; i <= 7; i++) {
    // @ts-ignore
    await page.$eval(`.rounds-holder > [data-round='${i}']`, (el) => el.click());

    const html = load(await page.content());

    const teams = html(`[data-shortname='full_result']`)
      .find(`[data-roundnumber='${i}']`)
      .toArray()
      .map((el) => el.attribs["data-shortname"]);

    const players = html(`[data-shortname='full_result']`)
      .find(`[data-roundnumber='${i}']`)
      .find(".player-name")
      .toArray()
      // @ts-ignore
      .map((el) => el.children[0].data);

    teams.forEach((team, index) => {
      const player: Player = {
        name: players[index],
        team: team,
      };

      draft.push(player);
    });
  }

  const currentDate = new Date().toISOString();
  writeFileSync(`./sites/SKA_${currentDate}.json`, JSON.stringify(draft));

  await browser.close();
}

async function scrapeSKA() {
  try {
    await scrape();
    console.log("Finished Sportskeeda Simulation");
  } catch (e) {
    console.log(`Sportskeeda Simulation failed with error: ${e}`);
  }
}

export default scrapeSKA;
