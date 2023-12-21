import scrapePFN from "./pfn";
import scrapeMDD from "./mdd";
import scrapeNDB from "./ndb";
import scrapeSKA from "./ska";
import scrapeOTC from "./otc";

const scrapers = [scrapePFN, scrapeMDD, scrapeNDB, scrapeSKA, scrapeOTC];

export default scrapers;
