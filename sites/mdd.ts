import { load } from "cheerio";
import { Page } from "puppeteer";
import { Player, Teams } from "../utils";

async function scrapeMDD(page: Page, teamsList: Teams) {
  const draft: Player[] = [];

  await page.goto("https://www.nflmockdraftdatabase.com/mock-draft-simulator");

  await page.waitForSelector("li[value='1']");
  await page.click("li[value='1']");
  await page.click("li[value='250']");

  await page.click(".hoverable.br-4px.w100p.mt-20px.brd-none.pd-20px.bold.bg-primary.color-white");

  await page.waitForSelector(".five-column-list.list-style-type-none.pd-0.mb-4px");
  await page.waitForSelector(".pdtb10-lr2.brd-none.w100p.bold.fs-14px.bg-none.color-white > .fas.fa-sync.fs-24px");
  //await page.click(".pdtb10-lr2.brd-none.w100p.bold.fs-14px.bg-none.color-white > .fas.fa-sync.fs-24px");

  await page.$eval(".fas.fa-sync.fs-24px", (el) => {
    //@ts-ignore
    el.click();
  });

  //@ts-ignore
  await page.$eval(".pdtb10-lr2.brd-none.w100p.bold.fs-14px.bg-none.color-orange", (el) => el.click());

  await page.waitForSelector(".modal-content", { timeout: 90000 });
  //@ts-ignore
  await page.$eval(".hoverable.pdtb10-lr2.w100p.bold.fs-14px.bg-white.color-sec.brd-1px-sec.btn.btn-primary", (el) => el.click());

  await page.waitForSelector(".mock-list");

  const html = load(await page.content());

  html(".mock-list:first").remove(); // Remove selections made for selected team to simplify querying

  const playerNames = html(".mock-list-item")
    .find(".player-name.player-name-bold > a")
    .toArray()
    // @ts-ignore
    .map((element) => element.children[0].data);

  // Need to transform teamNames to their associated abbreviation
  const teams = html(".mock-list-item")
    .find(".team-link > img")
    .toArray()
    .map((element) => {
      const alt = element.attribs["alt"];
      return teamsList[alt.substring(0, alt.indexOf(" "))];
    });

  teams.forEach((team, index) => {
    const player: Player = {
      name: playerNames[index],
      team: team,
    };

    draft.push(player);
  });

  return draft;
}

export default scrapeMDD;
