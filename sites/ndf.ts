import { Page } from "puppeteer";
import { Simulation } from "../utils";
import { load } from "cheerio";
import { sample } from "lodash";

async function scrapeNDF(page: Page) {
  const draft: Simulation = { players: [] };

  await page.goto("https://nfldraftfanatics.com/draft-configuration/");

  await page.waitForSelector(".team-item", { visible: true });
  const teamContainers = await page.$$(".team-item");
  sample(teamContainers)?.click();

  // @ts-ignore
  await page.$$eval(".sc-bBrHrO.jorVBw", (el) => el[el.length - 1].click());
  await page.waitForSelector(".enter-draft-btn", { visible: true });
  await page.click(".enter-draft-btn");

  await page.waitForSelector("text/Offer Trades", { visible: true });
  await page.click(".sc-fbPSWO.iWknUT > button");
  await page.waitForSelector("text/Offer Trades", { hidden: true });

  await page.waitForSelector("text/Remaining picks", { visible: true });
  const numberOfPicks = await page.$eval(".sc-gXmSlM.gMlgko", (el) => el.children.length);

  for (let i = 0; i < numberOfPicks; i++) {
    await page.waitForSelector(".player-draft-btn", { visible: true, timeout: 100000 });
    // @ts-ignore
    await page.$eval(".player-draft-btn", (el) => el.click());
    await page.waitForSelector(".player-draft-btn", { hidden: true, timeout: 80000 });

    // Trade Popup stalls simulation, so remove if present
    const tradeOffer = await page.$("text/Offer Trades");
    if (tradeOffer) await page.click("text/Reject");
  }

  await page.waitForSelector(".share-draft-wrap", { visible: true, timeout: 100000 });

  let html = load(await page.content());
  draft.pickedFor = html(".draft-result-pick-logo").first().children()[0].attribs["alt"];

  for (let i = 1; i <= 7; i++) {
    await page.click(`text/Round ${i}`);
    await page.waitForSelector(".draft-result-team-log", { visible: true });

    html = load(await page.content());

    html(".draft-result-team-log")
      .toArray()
      .forEach((el) => {
        draft.players.push({
          // @ts-ignore
          team: el.children[0].attribs["alt"],
          // @ts-ignore
          name: el.children[1].children[0].data,
        });
      });
  }

  return draft;
}

export default scrapeNDF;
