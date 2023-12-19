import { load } from "cheerio";
import puppeteer from "puppeteer";
import { Player, Positions } from ".";
import { writeFileSync } from "fs";

async function scrapeMFD(teamsList: { [key: string]: string }) {
  const draft: Player[] = [];

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0); //Ads dynamically load in, so need sufficient (infinite) timeout for loading to finish

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

  const positions = html(".mock-list-item")
    .find(".player-details")
    .toArray()
    .map((element) => {
      // @ts-ignore
      const text: string = element.children[0].data;
      return text.substring(0, text.indexOf(" "));
    });

  const schools = html(".mock-list-item")
    .find(".player-details > a")
    .toArray()
    //@ts-ignore
    .map((element) => element.children[1].data);

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
      position: positions[index] as unknown as Positions,
      school: schools[index],
    };

    draft.push(player);
  });

  const currentDate = new Date();
  writeFileSync(`./sites/MFD_${currentDate.toISOString()}.json`, JSON.stringify(draft));

  await browser.close();
}

export default scrapeMFD;