import { Page } from "puppeteer";
import { Teams } from "../utils";
import { load } from "cheerio";
import { sample } from "lodash";

async function scrapeOTC(page: Page, teamsList: Teams) {
  const randomTeam = sample(Object.keys(teamsList));

  await page.goto("https://fanspeak.com/ontheclock-nfl-mock-draft-simulator/");

  await page.click(`[data-team-shortname='${randomTeam?.split(" ").pop()?.toLowerCase()}']`);

  const [nextBtn] = await page.$x("//a[contains(text(), 'Next')]");
  // @ts-ignore
  await nextBtn?.click();

  await page.waitForSelector(".setup-option.round-number", { visible: true });
  await page.click("[data-rounds='7'] > div");
  await page.click("[data-board='0'] > div");
  await page.click("[data-teamneeds='0'] > div");
  await page.click("[data-pickorder='0'] > div");
  await page.click("[data-difficulty='classic'] > div");
  await page.click("[data-speed='fast'] > div");
  await page.click("[data-comp='0'] > div");

  const btn = await page.waitForSelector("text/Let's Draft", { visible: true });
  btn?.click();

  await page.waitForNavigation();

  // 7 rounds, one page per round
  for (let i = 1; i <= 7; i++) {
    // This simulator uses it's own power rankings, so need to fetch picks for selected team

    // Simulator doesn't show team picks until player is taken, so need cheerio to fetch
    const html = load(await page.content());

    const teamPicks = html("#picks_this_round")
      .find(".pick")
      .toArray()
      // @ts-ignore
      .filter((el) => el.children[2].data.includes(randomTeam));

    for (let j = 0; j < teamPicks.length; j++) {
      const div = await page.waitForSelector(".available-player-my-pick", { visible: true });
      await div?.click();

      const draftBtn = await page.waitForSelector("text/Draft this Player", { visible: true });
      draftBtn?.click();

      // Need to wait until pick is fully made to avoid missing the next one
      await page.waitForSelector("text/Draft this Player", { hidden: true });
    }

    if (i < 7) {
      const nextRdBtn = await page.waitForSelector("text/Next Round", { visible: true });
      nextRdBtn?.click();
    }

    await page.waitForNavigation();
  }

  const html = load(await page.content());

  return html("#all_picks")
    .find(".pick")
    .toArray()
    .map((el) => {
      // @ts-ignore
      const text: string = el.children[2].data.trim();
      const teamsKey = text.substring(text.lastIndexOf(" ") + 1);

      return {
        name: text.substring(text.indexOf(" ") + 1, text.indexOf("-") - 1),
        team: teamsList[teamsKey],
        selectedByScraper: randomTeam == teamsKey,
      };
    });
}

export default scrapeOTC;
