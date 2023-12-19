import { readFileSync, writeFile, readdirSync } from "fs";
import { load } from "cheerio";
import { Player, Teams, scrapeMFD, scrapeNDB, scrapePFN, toTitleCase } from "./utils";
import _ from "lodash";
import axios from "axios";

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
  const fileNames = readdirSync("./sites", { withFileTypes: true });

  fileNames.forEach(({ name }) => {
    let data = readFileSync(`./sites/${name}`, { encoding: "utf8", flag: "r" });
    const players: Player[] = JSON.parse(data);

    players.forEach((player, index) => {
      const team = player.team;

      if (draftOrder[index] != team) return;

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

  await scrapeMFD(reverseTeamsList);
  await scrapePFN();
  await scrapeNDB();

  const draftOrder = await getDraftOrder(reverseTeamsList);

  // draftOrder.forEach((team) => {
  //   teamsList[team] = { ...teamsList[team], number: (teamsList[team]["number"] || 0) + 1 };
  // });

  // console.log(teamsList);

  gatherResults(teamsList, draftOrder);
}

main();
