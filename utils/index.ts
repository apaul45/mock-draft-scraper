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
  name: string;
  team: string;
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

// async function readData() {
//   const res = await axios.get("https://www.nflmockdraftdatabase.com/user-mock-drafts/2024/user-mock-1885940", {
//     responseType: "document",
//   });

//   let data = readFileSync("./utils/teams.json", { encoding: "utf8", flag: "r" });
//   const teamsList: { [key: string]: any } = JSON.parse(data);
//   const reverseTeams = Object.fromEntries(
//     Object.entries(teamsList).map(([key, value]) => {
//       const fullName = value["fullName"];

//       return [fullName.substring(fullName.lastIndexOf(" ") + 1), key];
//     })
//   );

//   const draft: Player[] = [];

//   const html = load(res.data as any);

//   html(".mock-list:first").remove();

//   const playerNames = html(".mock-list-item")
//     .find(".player-name.player-name-bold > a")
//     .toArray()
//     // @ts-ignore
//     .map((element) => element.children[0].data);

//   const positions = html(".mock-list-item")
//     .find(".player-details")
//     .toArray()
//     .map((element) => {
//       // @ts-ignore
//       const text: string = element.children[0].data;
//       return text.substring(0, text.indexOf(" "));
//     });

//   const schools = html(".mock-list-item")
//     .find(".player-details > a")
//     .toArray()
//     //@ts-ignore
//     .map((element) => element.children[1].data);

//   const teams = html(".mock-list-item")
//     .find(".team-link > img")
//     .toArray()
//     .map((element) => {
//       const alt = element.attribs["alt"];
//       return reverseTeams[alt.substring(0, alt.indexOf(" "))];
//     });

//   teams.forEach((team, index) => {
//     const player: Player = {
//       name: playerNames[index],
//       team: team,
//       position: positions[index] as unknown as Positions,
//       school: schools[index],
//     };

//     draft.push(player);
//   });

//   writeFileSync("./sites/MFD.json", JSON.stringify(draft));
// }
