import { load } from "cheerio";
import { Page } from "puppeteer";
import { Simulation } from "../utils";

async function scrapeMDD(page: Page) {
  const draft: Simulation = { players: [] };

  await page.goto("https://www.nflmockdraftdatabase.com/mock-draft-simulator");

  const teamSelector = '::-p-text("Select All")';
  await page.waitForSelector(teamSelector);
  await page.click(teamSelector);

  const yearSelector = 'li[value="2025"]';
  await page.click(yearSelector);

  const roundsSelector = '.seven-column-list > li[value="7"]';
  await page.click(roundsSelector);

  const speedSelector = "li[value='250']";
  await page.click(speedSelector);

  const enterDraftSelector = '::-p-text("Enter Draft Room")';
  await page.click(enterDraftSelector);

  const autoDraftSelector = '::-p-text("Auto Draft")';
  await page.waitForSelector(autoDraftSelector, { visible: true });
  await page.click(autoDraftSelector);

  const startDraftSelector = '::-p-text("Start")';
  await page.waitForSelector(startDraftSelector, { visible: true });
  await page.click(startDraftSelector);

  const draftCompleteModalSelector = ".modal-content";
  await page.waitForSelector(draftCompleteModalSelector, {
    visible: true,
    timeout: 100000,
  });

  const saveDraftSelector = 'button::-p-text("Save")';
  await page.waitForSelector(saveDraftSelector, { visible: true });
  await page.click(saveDraftSelector);

  await page.waitForSelector(".mock-list", { visible: true });

  const html = load(await page.content());

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
