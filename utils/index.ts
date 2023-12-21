import scrapeMDD from "./mdd";
import scrapePFN from "./pfn";
import scrapeNDB from "./ndb";
import scrapeSKA from "./ska";
import scrapeOTC from "./otc";

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

export { Positions, Player, scrapeMDD, scrapePFN, scrapeNDB, scrapeSKA, scrapeOTC, toTitleCase, removeParanthesis, Teams };
