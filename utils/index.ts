import scrapeMFD from "./mfd";
import scrapePFN from "./pfn";

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

export { Positions, Player, scrapeMFD, scrapePFN };
