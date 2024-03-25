import axios from "axios";
import { load } from "cheerio";
import { readFileSync, readdirSync } from "fs";
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

interface Player {
  name: string;
  team: string;
}

interface Simulation {
  pickedFor?: string;
  players: Player[];
}

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

async function getDraftOrder(teamsList: Teams) {
  const res = await axios.get("https://www.tankathon.com/nfl/full_draft", {
    responseType: "document",
  });

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

function getDraftProspects(): Players {
  const file = readFileSync("./utils/prospects.json", { encoding: "utf-8" });
  return JSON.parse(file);
}

function isDateInThisWeek(date: Date) {
  const todayObj = new Date();
  const todayDate = todayObj.getDate();
  const todayDay = todayObj.getDay();

  // get first date of week
  const lastDayOfWeek = new Date(todayObj.setDate(todayDate - todayDay));

  // get last date of week
  const firstDayOfWeek = new Date(lastDayOfWeek);
  firstDayOfWeek.setDate(lastDayOfWeek.getDate() - 6);

  // if date is equal or within the first and last dates of the week
  return date >= firstDayOfWeek && date <= lastDayOfWeek;
}

// Only use results from within the week
function getMostRecentResult() {
  const [mostRecentResult] = readdirSync("./results").slice(-1);

  // Result files formatted as {date as iso string}.json
  const fileNameWithoutExt = Path.parse(mostRecentResult).name;
  if (!isDateInThisWeek(new Date(fileNameWithoutExt))) return;

  const file = readFileSync(`./results/${mostRecentResult}`, {
    encoding: "utf8",
  });
  const teamsList: Teams = JSON.parse(file);

  return teamsList;
}

// Only get sims from within the week
function getMostRecentSimulations(): Simulation[] {
  let fileNames = readdirSync("./simulations");

  return fileNames
    .filter((fileName) => {
      const fileNameWithoutExt = Path.parse(fileName).name;
      const fileDate = fileNameWithoutExt.split("_")[1];

      return isDateInThisWeek(new Date(fileDate));
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
  getDraftOrder,
  getDraftProspects,
  getMostRecentResult,
  getMostRecentSimulations,
};
