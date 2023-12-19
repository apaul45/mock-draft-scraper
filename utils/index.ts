import scrapeMFD from "./mfd";
import scrapePFN from "./pfn";
import scrapeNDB from "./ndb";

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

export { Positions, Player, scrapeMFD, scrapePFN, scrapeNDB, toTitleCase, removeParanthesis, Teams };
// const data = readFileSync("./wtf.html", { encoding: "utf-8", flag: "r" });
// const html = load(data);

// const playerNames = html("#combined-Pick-List > [id*='pick']")
//   .find(".team-meta__info.playerRankWidgetNameInfo")
//   .toArray()
//   .map((el) => el.attribs["title"]);

// console.log(playerNames);

// const positionSchools = html("#combined-Pick-List > [id*='pick']")
//   .find(".sim-pos-cont")
//   .toArray()
//   .map((el) => {
//     // @ts-ignore
//     const position = el.firstChild.children[0].data;
//     // @ts-ignore
//     const school = el.lastChild.children[0].data;

//     return [position, school];
//   });

// console.log(positionSchools);

// const teams = html("#combined-Pick-List > [id*='pick']")
//   .find(".sim-name-container > .draftValue:last-child")
//   .toArray()
//   //@ts-ignore
//   .map((el) => removeParanthesis(el.lastChild.data));

// console.log(teams);
