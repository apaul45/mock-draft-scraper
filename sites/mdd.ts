import { load } from "cheerio";
import { Page } from "puppeteer";
import { Simulation } from "../utils";

async function scrapeMDD(page: Page) {
  const draft: Simulation = { players: [] };

  await page.goto("https://www.nflmockdraftdatabase.com/mock-draft-simulator");

  await page.waitForSelector("li[value='1']");
  await page.click("li[value='1']");
  await page.click("li[value='250']");

  await page.click(
    ".hoverable.br-4px.w100p.mt-20px.brd-none.pd-20px.bold.bg-primary.color-white"
  );

  await page.waitForSelector(
    ".five-column-list.list-style-type-none.pd-0.mb-4px"
  );
  await page.waitForSelector(
    ".pdtb10-lr2.brd-none.w100p.bold.fs-14px.bg-none.color-white > .fas.fa-sync.fs-24px"
  );
  //await page.click(".pdtb10-lr2.brd-none.w100p.bold.fs-14px.bg-none.color-white > .fas.fa-sync.fs-24px");

  await page.$eval(".fas.fa-sync.fs-24px", (el) => {
    //@ts-ignore
    el.click();
  });

  await page.$eval(
    ".pdtb10-lr2.brd-none.w100p.bold.fs-14px.bg-none.color-orange",
    //@ts-ignore
    (el) => el.click()
  );

  await page.waitForSelector(".modal-content", { timeout: 90000 });
  await page.$eval(
    ".hoverable.pdtb10-lr2.w100p.bold.fs-14px.bg-white.color-sec.brd-1px-sec.btn.btn-primary",
    //@ts-ignore
    (el) => el.click()
  );

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
      return alt.substring(0, alt.indexOf(" "));
    });

  draft.players = teams.map((team, index) => {
    return {
      name: playerNames[index],
      team: team,
    };
  });

  return draft;
}

export default scrapeMDD;
