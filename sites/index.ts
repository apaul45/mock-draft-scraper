import scrapePFN from "./pfn";
import scrapeMDD from "./mdd";
import scrapeNDB from "./ndb";
import scrapeSKA from "./ska";
import scrapeOTC from "./otc";
import scrapeNDF from "./ndf";
import scrapeWTM from "./wtm";
import { Page } from "puppeteer";
import { Player, Teams } from "../utils";

enum Scrapers {
  PFN = "Pro Football Network",
  MDD = "Mock Draft Database",
  NDB = "Draft Buzz",
  SKA = "Sportkeeda",
  OTC = "On The Clock",
  NDF = "Draft Fanatics",
  WTM = "Walk The Mock",
}

interface Scraper {
  name: Scrapers;
  scraper: (page: Page, teamsList: Teams) => Promise<Player[]>;
}

const scrapers: Scraper[] = [
  { name: Scrapers.PFN, scraper: scrapePFN },
  { name: Scrapers.MDD, scraper: scrapeMDD },
  { name: Scrapers.NDB, scraper: scrapeNDB },
  { name: Scrapers.SKA, scraper: scrapeSKA },
  { name: Scrapers.OTC, scraper: scrapeOTC },
  { name: Scrapers.NDF, scraper: scrapeNDF },
  { name: Scrapers.WTM, scraper: scrapeWTM },
];

export { scrapers, Scrapers };
