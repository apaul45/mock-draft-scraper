import { Page } from "puppeteer";
import { Player, Simulation } from "../utils";
import { load } from "cheerio";

async function scrapeSKA(page: Page) {
  const draft: Simulation = { players: [] };

  await page.goto("https://www.sportskeeda.com/nfl/mock-draft-simulator");

  await page.waitForSelector(".team-selection-container");
  await page.click("#seven");
  await page.click("#fast");

  await page.click(".start-draft-btn");
  await page.waitForSelector(".draft-simulation-container", { visible: true });

  await page.waitForSelector("[data-shortname='full_result']", {
    visible: true,
    timeout: 50000,
  });

  for (let i = 1; i <= 7; i++) {
    await page.$eval(`.all-rounds-container > [data-round='${i}']`, (el) =>
      // @ts-ignore
      el.click()
    );

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

      draft.players.push(player);
    });
  }

  return draft;
}

export default scrapeSKA;
