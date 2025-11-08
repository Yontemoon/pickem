import puppeteer, { Browser } from "puppeteer"
import { TAPOLOGY_URL, TIMEOUT } from "./lib/constants.js"
import { delay } from "./lib/utils.js"
import Event from "./class/events.js"
import Fighter from "./class/fighter.js"
import { scrapeEventData } from "./lib/scrape.js"

async function main() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--single-process",
      ],
    })
    const page = await browser.newPage()
    console.log("Going into Tapology...")
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

    const eventsData = await page.$$eval(
      '[class="div flex flex-col border-b border-solid border-neutral-700"]',
      (elements) =>
        elements.map((el) => {
          const id = el.id.replace("preview", "")
          const aTag = el.querySelector("a")
          const event_title = aTag.textContent
          const date = el
            .querySelector("span[class='hidden md:inline']")
            .textContent.trim()
          return {
            id: id,
            event_title: event_title,
            href: aTag.href,
            date: date,
          }
        })
    )
    console.group(`Found ${eventsData.length} bouts`)

    if (eventsData.length >= 20) {
      console.warn("Fitlering did not work...")
      console.warn("Ending script.")
      throw Error("Filtering just UFC did not work")
    }

    eventsData.forEach(async (event) => {
      const newEvent = new Event(event)
      await newEvent.insert()
    })

    const data = await Promise.all(
      eventsData.map((event) => scrapeEventData(event, browser))
    )

    data.forEach((event) => {
      event.forEach(async (fight) => {
        const figher1 = new Fighter(fight.fighter1)
        const figher2 = new Fighter(fight.fighter2)

        await figher1.insert()
        await figher2.insert()
      })
    })

    await browser.close()
  } catch (error) {
    console.error(error)
  }

  console.log("Script finished! Yay.")
}

/**
 * @typedef {Object} FighterDetails
 * @property {number} id
 * @property {string} name
 * @property {string} href
 * @property {string | null} imageSrc
 * @property {string} winLos
 * @property {string} flagSrc
 *
 */

main()
