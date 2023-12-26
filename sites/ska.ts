import { Page } from "puppeteer";
import { Player } from "../utils";
import { load } from "cheerio";
import { writeFileSync } from "fs";

async function scrape(page: Page) {
  const draft: Player[] = [];

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

  await page.waitForSelector(".full-results-btn", { visible: true });
  await page.click(".full-results-btn");

  await page.waitForSelector("[data-shortname='full_result']", { visible: true });

  for (let i = 1; i <= 7; i++) {
    // @ts-ignore
    await page.$eval(`.all-rounds-container > [data-round='${i}']`, (el) => el.click());

    const html = load(await page.content());

    const roundContainer = ".round-selection-body";

    const teams = html(roundContainer)
      .find(`[data-roundnumber='${i}']`)
      .toArray()
      .map((el) => el.attribs["data-shortname"]);

    const players = html(roundContainer)
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
  writeFileSync(`./simulations/SKA_${currentDate}.json`, JSON.stringify(draft));
}

async function scrapeSKA(page: Page) {
  try {
    console.log("Starting Sportskeeda Simulation...");

    await scrape(page);

    console.log("Finished Sportskeeda Simulation\n");
  } catch (e) {
    console.log(`Sportskeeda Simulation failed with error: ${e}\n`);
  }
}

export default scrapeSKA;
