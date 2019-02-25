const puppeteer = require("puppeteer"),
  CREDS = require("./creds"),
  myUtil = require("./MyUtil");

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

async function run(symbolList, startIndex) {
  const browser = await puppeteer.launch({
    headless: false,
    // executablePath:'/app/koding/node_modules/puppeteer/.local-chromium/linux-624492/chrome-linux/chrome',
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://www.shareinvestor.com/user/login.html");
  // await page.waitForNavigation();
  // await page.screenshot({ path: "screenshots/shareinvestor.png" })
  setDownloadBehavior(page);

  await page.focus(USERNAME_SELECTOR);
  await page.keyboard.type(CREDS.username);

  await page.focus(PASSWORD_SELECTOR);
  await page.keyboard.type(CREDS.password);

  await page.click(BUTTON_SELECTOR);
  await page.waitForNavigation();

  let batchCount = 30;
  let prompt1 = "current index: %d, please press [go] to continue ...";
  let prompt2 = "try to process next %d counters";

  console.log(prompt1, startIndex);
  process.stdin.on("data", async function(key) {
    // ctrl-c ( end of text )
    if (key === "\u0003") {
      process.exit();
    }

    if (key.indexOf("go") == 0) {
      console.log(prompt2, batchCount);
      let start = startIndex;
      let counters = symbolList.slice(startIndex, startIndex + batchCount);
      for (let counter of counters) {
        await download(page, counter);
        startIndex++;
      }
      if (startIndex === start + batchCount) {
        console.log(prompt1, startIndex);
      }
    }
  });

  //   browser.close()
}

async function download(page, counter) {
  console.log("process ", counter);

  await page.goto(
    `https://www.shareinvestor.com/prices/price_download.html#/?type=price_download_by_stock&counter=${counter}`
  );
  await page.waitFor(5 * 1000);
  await page.click(DOWNLOAD_BUTTON_SELECTOR);
  // await page.waitForNavigation();
}

const getAllSymbols = () => {
  let lines = myUtil.readlinesSync("../chart/s/sg_shareinvestor.txt");
  let x = [],
    cells;
  lines.forEach((line, index) => {
    if (index === 0) return;
    cells = line.split(",");
    if (cells.length > 1) x.push(cells[0]);
  });
  return x;
};

let allSymbols = getAllSymbols();
let patchSymbols = [];

// run(getAllSymbols(), 23);
run(patchSymbols, 0);
