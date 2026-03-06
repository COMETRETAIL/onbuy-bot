const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/onbuy-refunds", async (req, res) => {

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto("https://seller.onbuy.com/login");

await page.fill('input[name="email"]', process.env.ONBUY_EMAIL);
await page.fill('input[name="password"]', process.env.ONBUY_PASSWORD);

await page.click('button[type="submit"]');

await page.waitForLoadState("networkidle");

await page.goto("https://seller.onbuy.com/orders/returns");

await page.waitForTimeout(3000);

const refunds = await page.evaluate(() => {

const rows = document.querySelectorAll("table tbody tr");

let data = [];

rows.forEach(row => {

const orderId = row.querySelector(".order-id")?.innerText;
const reason = row.querySelector(".reason")?.innerText;

if(orderId){
data.push({
order_id: orderId,
reason: reason
});
}

});

return data;
});

await browser.close();

res.json(refunds);

});

app.listen(3000, () => {
console.log("OnBuy bot running");
});
