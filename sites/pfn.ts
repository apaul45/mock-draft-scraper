import { load } from "cheerio";
import { Page } from "puppeteer";
import { Player, Simulation } from "../utils";

async function scrapePFN(page: Page) {
  const draft: Simulation = { players: [] };

  await page.goto("https://www.profootballnetwork.com/mockdraft");

  await page.waitForSelector(".inputs-container", { visible: true });
  await page.click("#seven");

  await page.click("#fast");
  await page.click(".start-draft-btn");

  await page.waitForSelector(".final-result-container", {
    visible: true,
    timeout: 70000,
  });

  const html = load(await page.content());

  const draftCards = html(".draft-simulation-container.hidden").find(
    ".pic-container"
  );

  const teams = draftCards
    .find(".team-logo-container")
    .toArray()
    .map((element) => element.attribs["data-teamname"]);

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

  return draft;
}

export default scrapePFN;
