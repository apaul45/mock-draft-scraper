import puppeteer from "puppeteer";
import { load } from "cheerio";
import { readFileSync, writeFileSync } from "fs";
import { Player, Positions } from "./utils";
import events from "events";

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

  writeFileSync(`./teams/players.json`, JSON.stringify(draft));
  await browser.close();
}

function formatAndWriteData() {
  let data = readFileSync("./utils/teams.json", { encoding: "utf8", flag: "r" });
  const teamsList: { [key: string]: any } = JSON.parse(data);

  data = readFileSync("./teams/players.json", { encoding: "utf8", flag: "r" });
  const players: Player[] = JSON.parse(data);

  players.forEach((player, index) => {
    const team = player.team;

    teamsList[team] = {
      ...teamsList[team],
      [index + 1]: { ...player, availablePlayers: players.slice(index + 1) },
    };
  });

  writeFileSync(`./teams/result.json`, JSON.stringify(teamsList));
}

async function main() {
  //await scrapePFN();
  formatAndWriteData();
}

main();
