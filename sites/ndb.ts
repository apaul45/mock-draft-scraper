import { Page } from "puppeteer";
import { Player, Simulation, removeParanthesis } from "../utils";
import { load } from "cheerio";

async function scrapeNDB(page: Page) {
  const draft: Simulation = { players: [] };

  await page.goto("https://www.nfldraftbuzz.com/simulator");

  await page.waitForSelector("#team-list-subcontainer");

  await page.click("#round-7");
  await page.click("#speed-250");
  await page.click("#trade-NO");
  await page.click("text/ENTER DRAFT");

  await page.waitForSelector("#startStopDraft");
  // @ts-ignore
  await page.$eval("#startStopDraft", (el) => el.click());

  await page.waitForSelector("#player-prospects-TableSub", { visible: true });

  await page.waitForSelector("#finish-header", { visible: true, timeout: 200000 });

  // Need visible: true to identify only once it's on the screen
  const closeBtn = await page.waitForSelector("#finish-header > div > .closeModel", { visible: true });
  closeBtn?.click();

  for (let i = 1; i <= 7; i++) {
    await page.$eval(`[data-round='${i}'] > a`, (el) => el.click());
    await page.waitForSelector(`.content-filter__item--active[data-round='${i}']`, { visible: true });

    await new Promise((r) => setTimeout(r, 2000)); // Needed since picks don't render right away

    const html = load(await page.content());

    const playerNames = html("#combined-Pick-List > [id*='pick']")
      .find(".team-meta__info.playerRankWidgetNameInfo")
      .toArray()
      .map((el) => el.attribs["title"]);

    const teams = html("#combined-Pick-List > [id*='pick']")
      .find(".sim-name-container > .draftValue:last-child")
      .toArray()
      //@ts-ignore
      .map((el) => removeParanthesis(el.lastChild.data));

    teams.forEach((team, index) => {
      const player: Player = {
        name: playerNames[index],
        team: team,
      };

      draft.players.push(player);
    });
  }

  return draft;
}

export default scrapeNDB;
