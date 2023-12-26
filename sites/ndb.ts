import { Page } from "puppeteer";
import { Player, removeParanthesis } from "../utils";
import { load } from "cheerio";
import { writeFileSync } from "fs";

async function scrape(page: Page) {
  const draft: Player[] = [];

  await page.goto("https://www.nfldraftbuzz.com/simulator");

  await page.waitForSelector("#team-list-subcontainer");

  await page.click("#round-7");
  await page.click("#instant-2000");
  await page.click("#trade-NO");
  await page.click("[teamid='48']"); //Chiefs have the least number of picks + sb contender

  await page.click(".btn.btn-default.btn-outline.btn-xs.card-header__button.openCloseTeamList");

  await page.waitForSelector("#startStopDraft");
  // @ts-ignore
  await page.$eval("#startStopDraft", (el) => el.click());

  await page.waitForSelector("#team-container-48");

  // Site doesn't allow auto draft, so get # of picks and choose BPA
  let html = load(await page.content());

  const length = html("#team-container-48")
    .find("[id*='to-select']")
    .toArray()
    .filter((el) => el.attribs["id"].match(/[0-9]/g)).length;

  for (let i = 0; i < length; i++) {
    await page.waitForSelector(
      ".btn.btn-default.btn-outline.btn-xs.card-header__button.sim-prospect-btn.unlocked-icon-bg.sim-draft-player-btn",
      { timeout: 40000 }
    );

    await page.$eval(
      ".btn.btn-default.btn-outline.btn-xs.card-header__button.sim-prospect-btn.unlocked-icon-bg.sim-draft-player-btn",
      // @ts-ignore
      (el) => el.click()
    );

    // Draft button doesn't change to locked right away, so need to manually wait for it
    await page.waitForSelector(
      ".btn.btn-default.btn-outline.btn-xs.card-header__button.sim-prospect-btn.locked-icon-bg.disabled-hover.no-click"
    );
  }

  await page.waitForSelector("#finish-header");

  // Need visible: true to identify only once it's on the screen
  const closeBtn = await page.waitForSelector("#finish-header > div > .closeModel", { visible: true });
  closeBtn?.click();

  for (let i = 1; i <= 7; i++) {
    await page.$eval(`[data-round='${i}'] > a`, (el) => el.click());
    await page.waitForSelector(`.content-filter__item--active[data-round='${i}']`, { visible: true });

    await new Promise((r) => setTimeout(r, 2000)); // Needed since picks don't render right away

    html = load(await page.content());

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

      draft.push(player);
    });
  }

  const currentDate = new Date().toISOString();
  writeFileSync(`./simulations/NDB_${currentDate}.json`, JSON.stringify(draft));
}

async function scrapeNDB(page: Page) {
  try {
    console.log("Starting Draft Buzz Simulation...");

    await scrape(page);

    console.log("Finished Draft Buzz Simulation\n");
  } catch (e) {
    console.log(`Draft Buzz Simulation failed with error: ${e}\n`);
  }
}

export default scrapeNDB;
