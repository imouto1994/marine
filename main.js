const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");

const { hideHeadless } = require("./stealth");
const localStorageData = require("./localStorage.json");
const cookiesData = require("./cookies.json");

async function scrapeURL(url) {
  const browser = await puppeteer.launch({
    args: [
      "--disable-web-security",
      "--disable-features=IsolateOrigins",
      " --disable-site-isolation-trials",
    ],
  });
  const page = await browser.newPage();

  await hideHeadless(page);

  await page.setViewport({
    width: 2000,
    height: 3000,
    deviceScaleFactor: 2,
  });

  await page.setCookie(
    ...cookiesData.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      secure: cookie.secure,
    }))
  );

  await page.goto("https://toptoonplus.com/");

  await page.evaluate((data) => {
    Object.keys(data).forEach(function (k) {
      localStorage.setItem(k, data[k]);
    });
  }, localStorageData);

  await page.goto(url);

  await page.waitForTimeout(3000);
  await page.screenshot({
    path: "./screenshot.png", // Save the screenshot in current directory
  });

  await browser.close();
}

(async () => {
  await scrapeURL("https://toptoonplus.com/comic/100552/111103");
})();
