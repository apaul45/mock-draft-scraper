import axios from "axios";
import { load } from "cheerio";
import { writeFileSync } from "fs";

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
}

type Teams = { [key: string]: any };
type Players = { [player: string]: { school: string; position: string } };

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => {
      return word.replace(word[0], word[0].toUpperCase());
    })
    .join(" ");
}

function removeParanthesis(str: string) {
  return str.replace(/[\])}[{(]/g, "");
}

function reverseTeamsObject(teamsList: Teams) {
  return Object.fromEntries(
    Object.entries(teamsList).map(([key, value]) => {
      const fullName = value["fullName"];

      return [fullName.substring(fullName.lastIndexOf(" ") + 1), key];
    })
  );
}

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

// async function getDraftProspects() {
//   const players: Players = {};

//   for (let i = 1; i <= 4; i++) {
//     const res = await axios.get(`https://www.drafttek.com/2024-NFL-Draft-Big-Board/Top-NFL-Draft-Prospects-2024-Page-${i}.asp`, {
//       responseType: "document",
//     });

//     const html = load(res.data);

//     html(".player-info > tbody")
//       .children("tr:not(.cellcolor2)")
//       .toArray()
//       .forEach((el) => {
//         // @ts-ignore
//         const player = el.children[5].children[0].data;
//         // @ts-ignore
//         const school = el.children[7].children[0].data;
//         // @ts-ignore
//         const position = el.children[9].children[0].data;

//         players[player] = { school, position };
//       });
//   }

//   writeFileSync("./utils/prospects.json", JSON.stringify(players));
// }

export { Positions, Player, toTitleCase, removeParanthesis, reverseTeamsObject, getDraftOrder, Teams };
