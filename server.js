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

    console.log("LOGIN PAGE:", page.url());

    // wait for login fields
    await page.waitForSelector('input[type="email"], input[name="email"]', {
      timeout: 60000
    });

    // enter email
    await page.fill(
      'input[type="email"], input[name="email"]',
      process.env.ONBUY_EMAIL
    );

    // enter password
    await page.fill(
      'input[type="password"], input[name="password"]',
      process.env.ONBUY_PASSWORD
    );

    // click login
    await page.click(
      'button[type="submit"], button:has-text("Log in"), button:has-text("Sign in")'
    );

    // wait for dashboard
    await page.waitForLoadState("networkidle");

    console.log("AFTER LOGIN URL:", page.url());

    // go to returns page
    await page.goto("https://seller.onbuy.com/gb/orders/returns", {
      waitUntil: "domcontentloaded"
    });

    await page.waitForTimeout(4000);

    const refunds = await page.evaluate(() => {
      const rows = document.querySelectorAll("table tbody tr");

      const data = [];

      rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        if (cells.length > 0) {
          data.push({
            order_id: cells[0]?.innerText?.trim(),
            product: cells[1]?.innerText?.trim(),
            reason: cells[2]?.innerText?.trim()
          });
        }
      });

      return data;
    });

    await browser.close();

    res.json({
      message: "Login successful",
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
