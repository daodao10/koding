const fs = require("fs"),
  util = require("util"),
  puppeteer = require("puppeteer"),
  CREDS = require("./creds-config");

// const { TimeoutError } = require("puppeteer/Errors");
process
  .on("uncaughtException", function(err) {
    console.error("Caught exception: " + err);
  })
  .on("unhandledRejection", err => {
    console.error("Caught exception: " + err);
  });

const USERNAME_SELECTOR = "#sic_login_header_username";
const PASSWORD_SELECTOR = "#sic_login_header_password";
const BUTTON_SELECTOR = "#sic_login_submit";

const DOWNLOAD_BUTTON_SELECTOR = "#sic_priceDownload>li>a";

const setDownloadBehavior = (
  page,
  downloadPath = "/Users/dao/Downloads/test/"
) => {
  return page._client.send("Page.setDownloadBehavior", {
    behavior: "allow",
    downloadPath
  });
};

async function delay(ms) {
  // return await for better async stack trace support in case of errors.
  return await new Promise(resolve => setTimeout(resolve, ms));
}

async function run(symbolList, startIndex) {
  const browser = await puppeteer.launch({
    // headless: false,
    // executablePath:'/app/koding/node_modules/puppeteer/.local-chromium/linux-624492/chrome-linux/chrome',
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://www.shareinvestor.com/user/login.html");

  setDownloadBehavior(page);

  await page.waitForSelector(BUTTON_SELECTOR);

  await page.focus(USERNAME_SELECTOR);
  await page.keyboard.type(CREDS.username);

  await page.focus(PASSWORD_SELECTOR);
  await page.keyboard.type(CREDS.password);

  await page.click(BUTTON_SELECTOR);

  await page.waitForNavigation();

  let batchCount = 30;
  let prompt1 = "[%s] current index: %d, try to process next %d counters";
  let prompt2 =
    "[%s] sleep 21 minutes then keep working again, press [ctrl + c] to exit ...";

  while (startIndex < symbolList.length) {
    console.log(
      prompt1,
      new Date().toLocaleTimeString(),
      startIndex,
      batchCount
    );

    let start = startIndex;
    let counters = symbolList.slice(startIndex, startIndex + batchCount);
    for (let counter of counters) {
      await download(page, counter);
      startIndex++;
    }

    if (startIndex === start + batchCount) {
      console.log(prompt2, new Date().toLocaleTimeString());
      await delay(21 * 60 * 1000);
      console.log("...");
    }
  }

  console.log("all done");
  browser.close();
}

async function download(page, counter) {
  await page.goto(
    `https://www.shareinvestor.com/prices/price_download.html#/?type=price_download_by_stock&counter=${counter}`
  );
  await page.waitForSelector(DOWNLOAD_BUTTON_SELECTOR);
  await page.waitFor(3 * 1000);
  await page.click(DOWNLOAD_BUTTON_SELECTOR);
  await page.waitFor(5 * 1000);
  console.log(`${counter} => done`);
}

async function getSymbols(filepath) {
  const readFile = util.promisify(fs.readFile);

  let x = [],
    cells;

  try {
    let content = await readFile(filepath);
    let lines = content.toString().split(/\r\n|\n/);
    lines.forEach((line, index) => {
      if (index === 0) return;
      cells = line.split(",");
      if (cells.length > 1) x.push(cells[0]);
    });
  } catch (err) {
    console.log("Error", err);
  }

  return x;
}

getSymbols("../chart/s/sg_shareinvestor.txt")
  .then(symbols => {
    console.log('all symbol:', symbols.length);
    run(symbols, 710);
  })
  .catch(err => console.error(err));
