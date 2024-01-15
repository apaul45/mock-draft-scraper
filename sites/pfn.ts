import { load } from "cheerio";
import { Page } from "puppeteer";
import { Player, Simulation } from "../utils";

async function scrapePFN(page: Page) {
  const draft: Simulation = { players: [] };

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

    teams.map((team, index) => {
      const player: Player = {
        name: players[index],
        team: team,
      };

      draft.players.push(player);
    });
  }

  return draft;
}

export default scrapePFN;
