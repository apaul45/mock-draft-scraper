import puppeteer from "puppeteer";
import { load } from "cheerio";
import { readFileSync, writeFileSync, writeFile, readdirSync } from "fs";
import { Player, Positions } from "./utils";
import _ from "lodash";

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

async function scrapePFN() {
  const draft: Player[] = [];

  const browser = await puppeteer.launch({ headless: "new", defaultViewport: null });
  const page = await browser.newPage();

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

  const currentDate = new Date();
  writeFileSync(`./sites/PFN_${currentDate.toISOString()}.json`, JSON.stringify(draft));

  await browser.close();
}

function formatAndWriteData(teamsList: { [key: string]: any }) {
  const fileNames = readdirSync("./sites", { withFileTypes: true });

  fileNames.forEach(({ name }) => {
    let data = readFileSync(`./sites/${name}`, { encoding: "utf8", flag: "r" });
    const players: Player[] = JSON.parse(data);

    players.forEach((player, index) => {
      const team = player.team;

      const availablePlayers = players.slice(index + 1).map((el) => el.name);
      const previousAvailablePlayers = teamsList[team][index + 1] ? teamsList[team][index + 1]["availablePlayers"] : availablePlayers;

      teamsList[team] = {
        ...teamsList[team],
        [index + 1]: { ...player, availablePlayers: _.intersection(availablePlayers, previousAvailablePlayers) },
      };
    });
  });

  console.log(`Processed ${fileNames.length} files`);
  writeFile(`./result.json`, JSON.stringify(teamsList), (err: any) => {});
}

async function main() {
  let data = readFileSync("./utils/teams.json", { encoding: "utf8", flag: "r" });
  const teamsList: { [key: string]: any } = JSON.parse(data);

  // Needed for MFD scraping
  const reverseTeamsList = Object.fromEntries(
    Object.entries(teamsList).map(([key, value]) => {
      const fullName = value["fullName"];

      return [fullName.substring(fullName.lastIndexOf(" ") + 1), key];
    })
  );

  //await scrapeMFD(reverseTeamsList);
  //await scrapePFN();
  formatAndWriteData(teamsList);
}

main();
