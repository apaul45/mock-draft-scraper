import puppeteer from "puppeteer";
import { load } from "cheerio";
import { readFileSync, writeFileSync } from "fs";
import { Player, Positions } from "./utils";
import events from "events";

async function scrapePFN(team: string) {
  const players: { [player: string]: Player } = {};

  const browser = await puppeteer.launch({ headless: "new", defaultViewport: null });
  const page = await browser.newPage();

  await page.goto("https://www.profootballnetwork.com/mockdraft");

  let html = load(await page.content());

  const img = html("[alt=NFL-team-logo]")
    .toArray()
    .map((img) => img.attribs["src"])
    .find((teamUrl) => {
      const teamName = teamUrl.substring(26, teamUrl.indexOf("."));
      return team.includes(teamName);
    });

  await page.click(`[src='${img}']`);
  await page.click("[id='7']");
  await page.click("#fast");
  await page.click("#lets-draft-button-desktop");

  await page.waitForSelector(".my-picks");
  await page.click(".my-picks");

  await page.waitForSelector(".user-teams-container");

  html = load(await page.content());

  const picks = html(".draft-sim-results-body.selected > .draft-card")
    .find(".number")
    .toArray()
    .map((div) => {
      //@ts-ignore
      const text = div.children[0].data;
      return text.substring(0, text.indexOf("."));
    });

  for (let i = 0; i < picks.length; i++) {
    await page.waitForSelector(".draft-button-div");
    await page.waitForSelector("#draft-button-icon");

    await page.click("#player-pool-container");

    html = load(await page.content());

    const draftCards = html("#player-pool-body > .draft-card");

    const playerNames = draftCards
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

    playerNames.forEach((player, index) => {
      if (!players[player]) {
        players[player] = { picks: [], position: positionSchools[index][0], school: positionSchools[index][1] };
      }

      players[player].picks.push(picks[i]);
    });

    await page.waitForSelector(".player-draft-button");
    await page.click(".player-draft-button");
  }

  writeFileSync(`./teams/${team}.json`, JSON.stringify(players));
  await browser.close();
}

async function main() {
  const data = readFileSync("./utils/teams.json", { encoding: "utf8", flag: "r" });
  const teamsList: { [key: string]: string } = JSON.parse(data);

  await scrapePFN(teamsList["NYJ"]);
}

main();
