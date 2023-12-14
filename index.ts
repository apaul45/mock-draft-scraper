import puppeteer from "puppeteer";
import { load } from "cheerio";
import { readFileSync } from "fs";

async function scrapePFN(team: string) {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
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

  await page.waitForSelector(".draft-sim-results-body.selected");

  html = load(await page.content());
  const length = html(".draft-sim-results-body.selected > .draft-card").toArray().length;

  for (let i = 0; i < length; i++) {
    await page.waitForSelector(".draft-button-div");
    await page.waitForSelector("#draft-button-icon");

    await page.click("#player-pool-container");

    await page.waitForSelector(".player-draft-button");
    await page.click(".player-draft-button");
  }

  await browser.close();
}

async function main() {
  const data = readFileSync("./utils/teams.json", { encoding: "utf8", flag: "r" });
  const teamsList: { [key: string]: string } = JSON.parse(data);

  scrapePFN(teamsList["NYG"]);
}

main();
