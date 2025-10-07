import puppeteer from "puppeteer"
import { TAPOLOGY_URL } from "./lib/constants.js"
import { delay } from "./lib/utils.js"

async function main() {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(`${TAPOLOGY_URL}/fightcenter`, {
      waitUntil: "networkidle2",
    })

    console.log("Filtering UFC...")
    await page.evaluate(() => {
      const select = document.querySelector("#group")
      if (select) {
        select.value = "ufc"
        const event = new Event("change", { bubbles: true })
        select.dispatchEvent(event)
      }
    })
    await delay(3000)

    await page.waitForSelector('[data-controller="bout-toggler"]', {
      timeout: 15000,
    })

    const boutData = await page.$$eval(
      '[class="div flex flex-col border-b border-solid border-neutral-700"]',
      (elements) => elements.map((el) => el.textContent.trim())
    )

    console.log(`Found ${boutData.length} bouts`)

    await browser.close()
  } catch (error) {
    console.error(error)
  }
}

main()
