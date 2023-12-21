import { load } from "cheerio";
import { Page } from "puppeteer";
import { Player } from "../utils";
import { writeFileSync } from "fs";

async function scrape(page: Page) {
  const draft: Player[] = [];

  await page.goto("https://www.profootballnetwork.com/mockdraft");

  await page.waitForSelector("#lets-draft-button-desktop");
  await page.click("[id='7']");
  await page.click("#fast");
  await page.click("#lets-draft-button-desktop");

  await page.waitForSelector("#full-sim-results-div", { timeout: 70000 });

  for (let i = 1; i <= 7; i++) {
    await page.click(`[data-round='${i}']`);

    const html = load(await page.content());

    const draftCards = html(".round-picks-holder > .draft-card");

    const teams = draftCards
      .find(".team-logo-sm")
      .toArray()
      .map((element) => element.attribs["alt"]);

    const players = draftCards
      .find(".player-name")
      .toArray()
      //@ts-ignore
      .map((element) => element.children[0].data);

    teams.forEach((team, index) => {
      const player: Player = {
        name: players[index],
        team: team,
      };

      draft.push(player);
    });
  }

  const currentDate = new Date().toISOString();
  writeFileSync(`./simulations/PFN_${currentDate}.json`, JSON.stringify(draft));
}

async function scrapePFN(page: Page) {
  try {
    await scrape(page);
    console.log("Finished Pro Football Network Simulation");
  } catch (e) {
    console.log(`Pro Football Network Simulation failed with error: ${e}`);
  }
}

export default scrapePFN;
