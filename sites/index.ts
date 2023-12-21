import scrapePFN from "./pfn";
import scrapeMDD from "./mdd";
import scrapeNDB from "./ndb";
import scrapeSKA from "./ska";
import scrapeOTC from "./otc";
import scrapeNDF from "./ndf";

const scrapers = [scrapePFN, scrapeMDD, scrapeNDB, scrapeSKA, scrapeOTC, scrapeNDF];

export default scrapers;
