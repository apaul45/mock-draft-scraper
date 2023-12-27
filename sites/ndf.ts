import { Page } from "puppeteer";
import { Player, Teams } from "../utils";
import { load } from "cheerio";
import { writeFileSync } from "fs";

async function scrapeNDF(page: Page, teamsList: Teams) {
  const draft: Player[] = [];

  await page.goto("https://nfldraftfanatics.com/draft-configuration/");

  await page.waitForSelector(".team-item", { visible: true });
  await page.click(".team-item > img[alt='Chiefs']"); // Can't auto draft so choose team w/least picks (chiefs)

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
    await new Promise((r) => setTimeout(r, 5000)); // Needed since trade offer may pop up

    const tradeOffer = await page.$("text/Offer Trades");
    if (tradeOffer) await page.click("text/Reject");

    await page.waitForSelector(".player-draft-btn", { visible: true, timeout: 10000 });
    await page.click(".player-draft-btn");
    await page.waitForSelector(".player-draft-btn", { hidden: true, timeout: 5000 });
  }

  await page.waitForSelector(".share-draft-wrap", { visible: true, timeout: 30000 });

  for (let i = 1; i <= 7; i++) {
    await page.click(`text/Round ${i}`);
    await page.waitForSelector(".sc-gYMRRK.hKUgMV", { visible: true });

    const html = load(await page.content());

    html(".draft-result-team-log")
      .toArray()
      .forEach((el) => {
        draft.push({
          // @ts-ignore
          team: teamsList[el.children[0].attribs["alt"]],
          // @ts-ignore
          name: el.children[1].children[0].data,
        });
      });
  }

  const currentDate = new Date().toISOString();
  writeFileSync(`./simulations/NDF_${currentDate}.json`, JSON.stringify(draft));
}

export default scrapeNDF;
