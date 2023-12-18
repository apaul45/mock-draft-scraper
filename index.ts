import { readFileSync, writeFile, readdirSync } from "fs";
import { Player, scrapeMFD, scrapePFN } from "./utils";
import _ from "lodash";

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

  await scrapeMFD(reverseTeamsList);
  await scrapePFN();
  formatAndWriteData(teamsList);
}

main();
