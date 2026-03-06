const express = require("express");
const { chromium } = require("playwright");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("OnBuy bot running");
});

app.get("/onbuy-refunds", async (req, res) => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto("https://seller.onbuy.com/gb/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    console.log("PAGE URL:", page.url());

    await page.screenshot({
      path: "/tmp/debug.png",
      fullPage: true
    });

    // wait for ANY input field instead of guessing selector
    await page.waitForSelector("input", { timeout: 60000 });

    const refunds = [];

    await browser.close();

    res.json({
      message: "Page reached successfully",
      url: page.url(),
      refunds
    });

  } catch (err) {
    console.error("BOT ERROR:", err);

    if (browser) {
      await browser.close();
    }

    res.status(500).json({
      error: "Bot failed",
      message: err.message
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`OnBuy bot running on port ${PORT}`);
});
