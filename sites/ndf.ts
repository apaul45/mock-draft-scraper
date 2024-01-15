import { Page } from "puppeteer";
import { Player, Teams } from "../utils";
import { load } from "cheerio";
import { sample } from "lodash";

async function scrapeNDF(page: Page, teamsList: Teams) {
  const draft: Player[] = [];
  const randomTeam = sample(Object.keys(teamsList));

  await page.goto("https://nfldraftfanatics.com/draft-configuration/");

  await page.waitForSelector(".team-item", { visible: true });
  await page.click(`.team-item > img[alt='${randomTeam?.split(" ").pop()}']`);

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
    await page.waitForSelector(".player-draft-btn", { visible: true, timeout: 50000 });
    // @ts-ignore
    await page.$eval(".player-draft-btn", (el) => el.click());
    await page.waitForSelector(".player-draft-btn", { hidden: true, timeout: 50000 });

    // Trade Popup stalls simulation, so remove if present
    const tradeOffer = await page.$("text/Offer Trades");
    if (tradeOffer) await page.click("text/Reject");
  }

  await page.waitForSelector(".share-draft-wrap", { visible: true, timeout: 100000 });

  for (let i = 1; i <= 7; i++) {
    await page.click(`text/Round ${i}`);
    await page.waitForSelector(".sc-gYMRRK.hKUgMV", { visible: true });

    const html = load(await page.content());

    html(".draft-result-team-log")
      .toArray()
      .forEach((el) => {
        // @ts-ignore
        const teamKey = el.children[0].attribs["alt"];

        draft.push({
          // @ts-ignore
          team: teamsList[teamKey],
          // @ts-ignore
          name: el.children[1].children[0].data,
          selectedByScraper: randomTeam == teamKey,
        });
      });
  }

  return draft;
}

export default scrapeNDF;
