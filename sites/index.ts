import scrapePFN from "./pfn";
import scrapeMDD from "./mdd";
import scrapeNDB from "./ndb";
import scrapeSKA from "./ska";
import scrapeOTC from "./otc";
import scrapeNDF from "./ndf";
import scrapeWTM from "./wtm";
import { Page } from "puppeteer";
import { Simulation } from "../utils";

enum Scrapers {
  PFN = "Pro Football Network",
  MDD = "Mock Draft Database",
  NDB = "Draft Buzz",
  SKA = "Sportskeeda",
  OTC = "On The Clock",
  NDF = "Draft Fanatics",
  WTM = "Walk The Mock",
}

interface Scraper {
  name: Scrapers;
  scraper: (page: Page) => Promise<Simulation>;
}

const scrapers: Scraper[] = [];

export { scrapers, Scrapers };
