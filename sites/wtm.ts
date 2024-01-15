import { Page } from "puppeteer";
import { load } from "cheerio";
import dotenv from "dotenv";
import { sample } from "lodash";
import { Simulation } from "../utils";

async function scrapeWTM(page: Page) {
  const draft: Simulation = { players: [] };

  dotenv.config();

  await page.goto("https://www.walkthemock.com/login");

  // This site requires an account to draft, can create free one
  await page.waitForSelector(".login-form", { visible: true });
  await page.type("#email-input", process.env.WTM_USERNAME as string);
  await page.type("#password-input", process.env.WTM_PASSWORD as string);
  await page.click("[type='submit']");

  await page.waitForSelector(".profile-items", { visible: true });

  await page.goto("https://www.walkthemock.com/team-select?mode=standard");
  await page.waitForSelector(".division", { visible: true });

  // Randomly choose a team to draft BPA for
  const teams = await page.$$(".team-name");
  await sample(teams)?.click();

  // Go through all dialogs
  // @ts-ignore
  await page.$eval(".select-team--btn", (btn) => btn.click());
  await page.waitForSelector("text/Default Ranking");
  await page.click("text/Default Ranking");
  // @ts-ignore
  await page.$eval("text/To Draft Room", (btn) => btn.click());

  // Have to close out upgrade ad
  await page.waitForSelector(".fa-times-square", { timeout: 20000 });
  // @ts-ignore
  await page.$eval(".fa-times-square", (btn) => btn.click());

  await page.click("text/Start Draft");

  await page.waitForSelector(".my-picks", { visible: true });
  const numberOfPicks = await page.$$eval(".pick-content", (picks) => picks.length);

  for (let i = 0; i < numberOfPicks; i++) {
    await page.waitForSelector("[uib-tooltip='Draft']", { visible: true });
    // @ts-ignore
    await page.$eval(".draft-btn", (btn) => btn.click());
  }

  // Locate and click button to go to results page
  await page.waitForSelector(".modal-footer > a", { visible: true });
  await page.$eval(".modal-footer > a", (btn) => btn.click());

  await page.waitForSelector(".results-picks", { visible: true });
  const html = load(await page.content());

  // @ts-ignore
  draft.pickedFor = html("#user-picks > .draft-adv").toArray()[0].children[0].data.split(" ")[2];

  draft.players = html("overall-selection")
    .find("tbody")
    .find("tr.ng-scope")
    .toArray()
    .map((tr) => {
      return {
        // @ts-ignore
        team: tr.children[3].children[0].attribs["alt"],
        // @ts-ignore
        name: tr.children[5].children[0].data,
      };
    });

  return draft;
}

export default scrapeWTM;
