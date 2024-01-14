import { Page } from "puppeteer";
import { Player, Teams, removeParanthesis } from "../utils";
import { load } from "cheerio";
import { sample } from "lodash";

async function scrapeNDB(page: Page, teamsList: Teams) {
  const draft: Player[] = [];
  const randomTeam = sample(Object.keys(teamsList))?.split(" ").pop();

  await page.goto("https://www.nfldraftbuzz.com/simulator");

  await page.waitForSelector("#team-list-subcontainer");

  await page.click("#round-7");
  await page.click("#instant-2000");
  await page.click("#trade-NO");
  await page.click(`[title='${randomTeam}']`);

  await page.click(".btn.btn-default.btn-outline.btn-xs.card-header__button.openCloseTeamList");

  await page.waitForSelector("#startStopDraft");
  // @ts-ignore
  await page.$eval("#startStopDraft", (el) => el.click());

  await page.waitForSelector("#player-prospects-TableSub", { visible: true });

  // Site doesn't allow auto draft, so get # of picks and choose BPA
  let html = load(await page.content());

  const numberOfPicks = html("#player-prospects-TableSub")
    .find("[id*='to-select']")
    .toArray()
    .filter((el) => el.attribs["id"].match(/[0-9]/g)).length;

  for (let i = 0; i < numberOfPicks; i++) {
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

  return draft;
}

export default scrapeNDB;
