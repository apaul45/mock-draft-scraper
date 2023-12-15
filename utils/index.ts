enum Positions {
  Quarterback = "QB",
  RunningBack = "HB",
  WideReceiver = "WR",
  TightEnd = "TE",
  OTackle = "T",
  Center = "C",
  Guard = "G",
  DTackle = "DT",
  EdgeRusher = "ED",
  DefensiveEnd = "DE",
  Safety = "S",
  Cornerback = "CB",
  Linebacker = "LB",
}

interface Player {
  picks: number[];
  position: Positions;
  school: string;
}

export { Positions, Player };

// async function getTeams(page: Page) {
//   await page.goto(
//     "https://www.google.com/search?q=list+of+nfl+teams+abbreviations&sca_esv=590785432&sxsrf=AM9HkKlRwgPSEllWvwfNHmHUHU-3WHiUpw%3A1702528089789&ei=WYR6ZergL_mjptQPy8epwAo&oq=list+of+nfl+teams+with+abb&gs_lp=Egxnd3Mtd2l6LXNlcnAiGmxpc3Qgb2YgbmZsIHRlYW1zIHdpdGggYWJiKgIIADIGEAAYFhgeMgsQABiABBiKBRiGAzILEAAYgAQYigUYhgMyCxAAGIAEGIoFGIYDSL8rULMEWJgecAd4AZABAJgBkwGgAc0LqgEDNy44uAEDyAEA-AEBwgIKEAAYRxjWBBiwA8ICDRAAGIAEGIoFGEMYsAPCAg4QABjkAhjWBBiwA9gBAcICExAuGIAEGIoFGEMYyAMYsAPYAQLCAgUQABiABMICCxAAGIAEGIoFGJECwgIHEAAYgAQYDeIDBBgAIEGIBgGQBhO6BgYIARABGAm6BgYIAhABGAg&sclient=gws-wiz-serp"
//   );
//   const html = load(await page.content());
//   const teamsList: { [key: string]: string } = {};

//   html(".uoFCfc")
//     .toArray()
//     .forEach((element) => {
//       // @ts-ignore
//       const abbreviation = element.children[0].children[0].data.toUpperCase();
//       // @ts-ignore
//       const teamName = element.children[1].children[0].children[0].data;

//       teamsList[abbreviation] = teamName;
//     });

//   await writeFile("./teams.json", JSON.stringify(teamsList), (error) => {});
// }

// Mobile version of PFN
// async function scrapePFN(team: string) {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   await page.goto("https://www.profootballnetwork.com/mockdraft");
//   await page.waitForSelector("#nfc-conf");
//   await page.click("#nfc-conf");

//   let html = load(await page.content());

//   const img = html("[alt=NFL-team-logo]")
//     .toArray()
//     .map((img) => img.attribs["src"])
//     .find((teamUrl) => {
//       const teamName = teamUrl.substring(26, teamUrl.indexOf("."));
//       return team.includes(teamName);
//     });

//   await page.click(`[src='${img}']`);
//   await page.waitForSelector("#start-sim-button-mobile");
//   await page.click("#start-sim-button-mobile");

//   await page.waitForSelector(".rounds-options");

//   await page.click("[id='7']");
//   await page.click("#fast");
//   await page.click("#lets-draft-button");

//   await page.waitForSelector("#my-picks-tab");
//   await page.click("#my-picks-tab");

//   await page.waitForSelector("#my-picks-container-mobile");

//   html = load(await page.content());
//   const length = html("#my-picks-container-mobile > .draft-sim-results-body > .draft-card").toArray().length;

//   console.log(length);

//   for (let i = 0; i < 5; i++) {
//     await page.waitForSelector("#player-pool-tab");
//     await page.click("#player-pool-tab");

//     await page.waitForSelector(".draft-button-div");
//     await page.waitForSelector("#draft-button-icon");

//     await page.click("#player-pool-container-mobile");

//     console.log("clicked on player pool container!");

//     await page.waitForSelector(".player-draft-button");
//     await page.click(".player-draft-button");
//     await page.click(".player-draft-button");
//     console.log("Successfully drafted a player for giants!! AGREEGE");
//   }
// }
