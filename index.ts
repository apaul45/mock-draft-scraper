import { readFileSync, writeFile, readdirSync } from "fs";
import { load } from "cheerio";
import { Player, Teams, toTitleCase } from "./utils";
import _ from "lodash";
import axios from "axios";
import scrapers from "./sites";
import puppeteer from "puppeteer";
import { PuppeteerBlocker } from "@cliqz/adblocker-puppeteer";
import { fetch } from "cross-fetch";

async function getDraftOrder(teamsList: Teams) {
  const res = await axios.get("https://www.tankathon.com/nfl/full_draft", { responseType: "document" });

  const html = load(res.data);

  const draftOrder = html(".team-link > a")
    .toArray()
    .map((el) => {
      const link = el.attribs["href"];
      const team = link.substring(link.lastIndexOf("/") + 1);

      return teamsList[toTitleCase(team)];
    });

  return draftOrder;
}

function gatherResults(teamsList: Teams, draftOrder: string[]) {
  const fileNames = readdirSync("./simulations", { withFileTypes: true });

  fileNames.forEach(({ name }) => {
    let data = readFileSync(`./simulations/${name}`, { encoding: "utf8", flag: "r" });
    const players: Player[] = JSON.parse(data);

    players.forEach(({ name, team }, index) => {
      if (draftOrder[index] != team) return;

      const pickedPlayers = teamsList[team][index + 1]?.["picked"] || [];

      const availablePlayers = players.slice(index + 1).map((el) => el.name);
      const previousAvailablePlayers = teamsList[team][index + 1]?.["availablePlayers"] || availablePlayers;

      teamsList[team] = {
        ...teamsList[team],
        [index + 1]: {
          picked: [...pickedPlayers, name],
          availablePlayers: _.intersection(availablePlayers, previousAvailablePlayers),
        },
      };
    });
  });

  console.log(`Processed ${fileNames.length} files`);
  writeFile(`./result.json`, JSON.stringify(teamsList), (err: any) => {});
}

async function main() {
  let data = readFileSync("./utils/teams.json", { encoding: "utf8", flag: "r" });

  const teamsList: Teams = JSON.parse(data);

  const reverseTeamsList = Object.fromEntries(
    Object.entries(teamsList).map(([key, value]) => {
      const fullName = value["fullName"];

      return [fullName.substring(fullName.lastIndexOf(" ") + 1), key];
    })
  );

  const browser = await puppeteer.launch({ headless: "new", args: [`--window-size=1920,1080`], defaultViewport: null });

  for (let i = 0; i < scrapers.length; i++) {
    const page = await browser.newPage();

    // Ads on this site cause a insanely long timeout, so block
    const blocker = await PuppeteerBlocker.fromPrebuiltAdsAndTracking(fetch);
    await blocker.enableBlockingInPage(page);

    await scrapers[i](page, reverseTeamsList);
  }

  await browser.close();

  const draftOrder = await getDraftOrder(reverseTeamsList);
  gatherResults(teamsList, draftOrder);
}

main();
