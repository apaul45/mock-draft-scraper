import { load } from "cheerio";
import puppeteer from "puppeteer";
import { Player } from ".";
import { writeFileSync } from "fs";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import { fetch } from "cross-fetch";

async function scrapePFN() {
  const draft: Player[] = [];

  const browser = await puppeteer.launch({ headless: "new", defaultViewport: null });
  const page = await browser.newPage();

  // Ads on this site cause a insanely long timeout, so block
  const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
  await blocker.enableBlockingInPage(page);

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

    const positionSchools = draftCards
      .find(".player-position-school")
      .toArray()
      .map((element) => {
        //@ts-ignore
        const positionSchool = element.children[0].data;
        const splitIndex = positionSchool.indexOf(" ");

        return [positionSchool.substring(0, splitIndex), positionSchool.substring(splitIndex + 1)];
      });

    teams.forEach((team, index) => {
      const player: Player = {
        name: players[index],
        team: team,
        position: positionSchools[index][0],
        school: positionSchools[index][1],
      };

      draft.push(player);
    });
  }

  const currentDate = new Date().toISOString();
  writeFileSync(`./sites/PFN_${currentDate}.json`, JSON.stringify(draft));

  await browser.close();
}

export default scrapePFN;
