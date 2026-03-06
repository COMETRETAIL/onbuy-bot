const express = require("express");
const { chromium } = require("playwright");

const app = express();

const PORT = process.env.PORT || 3000;

/*
Health check route
*/
app.get("/", (req, res) => {
  res.send("OnBuy bot running");
});

/*
Refund scraper route
*/
app.get("/onbuy-refunds", async (req, res) => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // open seller login page
    await page.goto("https://seller.onbuy.com/gb/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // wait for login fields
    await page.waitForSelector('input[type="email"], input[name="email"], input#email', {
      timeout: 60000
    });

    // enter credentials
    await page.fill(
      'input[type="email"], input[name="email"], input#email',
      process.env.ONBUY_EMAIL
    );

    await page.fill(
      'input[type="password"], input[name="password"], input#password',
      process.env.ONBUY_PASSWORD
    );

    // click login
    await page.click(
      'button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")'
    );

    // wait for dashboard to load
    await page.waitForLoadState("networkidle");

    // go to returns page
    await page.goto("https://seller.onbuy.com/gb/orders/returns", {
      waitUntil: "domcontentloaded"
    });

    // give table time to load
    await page.waitForTimeout(5000);

    // scrape refund rows
    const refunds = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr");

      const results = [];

      rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        if (cells.length > 0) {
          results.push({
            order_id: cells[0]?.innerText?.trim(),
            product: cells[1]?.innerText?.trim(),
            reason: cells[2]?.innerText?.trim()
          });
        }
      });

      return results;
    });

    await browser.close();

    res.json(refunds);
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
