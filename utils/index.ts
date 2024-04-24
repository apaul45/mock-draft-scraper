import axios from "axios";
import { load } from "cheerio";
import { readFileSync, readdirSync, writeFileSync } from "fs";
import Path from "path";

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

type Player = {
  name: string;
  team: string;
};

type Simulation = {
  pickedFor?: string;
  players: Player[];
};

interface ProspectsWithADP extends Player {
  ADP?: number;
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

async function fetchDraftOrder() {
  const { reverseTeamsList: teams } = getTeams();

  const res = await axios.get("https://www.tankathon.com/nfl/full_draft", {
    responseType: "document",
  });

  const html = load(res.data);

  const draftOrder = html(".team-link > a")
    .toArray()
    .map((el) => {
      const link = el.attribs["href"];
      const team = link.substring(link.lastIndexOf("/") + 1);

      return teams[toTitleCase(team)];
    });

  writeFileSync("./utils/draftorder.json", JSON.stringify(draftOrder));
}

function getDraftOrder() {
  const file = readFileSync("./utils/draftorder.json", { encoding: "utf-8" });
  return JSON.parse(file);
}

function getDraftProspects(): Players {
  const file = readFileSync("./utils/prospects.json", { encoding: "utf-8" });
  return JSON.parse(file);
}

function isDateWithin(date: Date, range: number) {
  const today = new Date();

  const start = new Date(today);
  start.setDate(today.getDate() - range);

  return date >= start && date <= today;
}

// Only use results from within certain time period
function getMostRecentResult(range: number = 30): Teams | undefined {
  const [mostRecentResult] = readdirSync("./results").slice(-1);

  // Result files formatted as {date as iso string}.json
  const fileNameWithoutExt = Path.parse(mostRecentResult).name;

  if (!isDateWithin(new Date(fileNameWithoutExt), range)) return;

  const file = readFileSync(`./results/${mostRecentResult}`, {
    encoding: "utf8",
  });
  return JSON.parse(file);
}

// Only get sims from within certain time period
function getMostRecentSimulations(range: number = 30): Simulation[] {
  let fileNames = readdirSync("./simulations");

  return fileNames
    .filter((fileName) => {
      const fileNameWithoutExt = Path.parse(fileName).name;
      const fileDate = fileNameWithoutExt.split("_")[1];

      return isDateWithin(new Date(fileDate), range);
    })
    .map((fileName) => {
      const data = readFileSync(`./simulations/${fileName}`, {
        encoding: "utf8",
      });
      return JSON.parse(data);
    });
}

export {
  Positions,
  Teams,
  Players,
  Player,
  Simulation,
  ProspectsWithADP,
  toTitleCase,
  removeParanthesis,
  getTeams,
  fetchDraftOrder,
  getDraftOrder,
  getDraftProspects,
  getMostRecentResult,
  getMostRecentSimulations,
};
