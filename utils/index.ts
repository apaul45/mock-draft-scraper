import axios from "axios";
import { load } from "cheerio";
import { readFileSync } from "fs";

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

type Teams = { [key: string]: any };
type Players = { [player: string]: { school: string; position: string } };

interface Player {
  name: string;
  team: string;
}

interface Simulation {
  pickedFor?: string;
  players: Player[];
}

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

function getTeams() {
  const file = readFileSync("./utils/teams.json", { encoding: "utf8" });
  const teamsList: Teams = JSON.parse(file);

  const reverseTeamsList = Object.fromEntries(
    Object.entries(teamsList).map(([key, value]) => {
      const fullName = value["fullName"];

      return [fullName.split(" ").pop(), key];
    })
  );

  return { teamsList, reverseTeamsList };
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

export { Positions, Teams, Players, Player, Simulation, toTitleCase, removeParanthesis, getTeams, getDraftOrder };
