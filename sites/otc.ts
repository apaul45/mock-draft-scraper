import puppeteer, { Page } from "puppeteer";
import { Player, Positions, Teams } from "../utils";
import { load } from "cheerio";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import fetch from "cross-fetch";
import { writeFileSync } from "fs";

async function scrape(page: Page, teamsList: Teams) {
  await page.goto("https://fanspeak.com/ontheclock-nfl-mock-draft-simulator/");

  await page.click("[data-team-shortname='chiefs']"); // Not auto draft, so choose team w/least picks

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

  for (let i = 1; i <= 7; i++) {
    // This simulator uses it's own power rankings, so need to fetch picks for selected team

    const html = load(await page.content());

    const teamPicks = html("#picks_this_round")
      .find(".pick")
      .toArray()
      // @ts-ignore
      .filter((el) => el.children[2].data.includes("Kansas City Chiefs"));

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

  const picks: Player[] = html("#all_picks")
    .find(".pick")
    .toArray()
    .map((el) => {
      // @ts-ignore
      const text: string = el.children[2].data.trim();

      return {
        position: text.substring(0, text.indexOf(" ")) as Positions,
        name: text.substring(text.indexOf(" ") + 1, text.indexOf("-") - 1),
        team: teamsList[text.substring(text.lastIndexOf(" ") + 1)],
      };
    });

  const currentDate = new Date().toISOString();
  writeFileSync(`./simulations/OTC_${currentDate}.json`, JSON.stringify(picks));
}

async function scrapeOTC(teamsList: Teams) {
  const browser = await puppeteer.launch({ headless: "new", args: [`--window-size=1920,1080`], defaultViewport: null });

  try {
    const page = await browser.newPage();

    // Ads on this site cause a insanely long timeout, so block
    const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
    await blocker.enableBlockingInPage(page);

    await scrape(page, teamsList);
    console.log("Finished On The Clock Simulation");
  } catch (e) {
    console.log(`On The Clock Simulation failed with error: ${e}`);
  } finally {
    await browser.close();
  }
}

export default scrapeOTC;
