import puppeteer, { Browser } from "puppeteer"
import { TAPOLOGY_URL } from "./lib/constants.js"
import { delay } from "./lib/utils.js"

async function main() {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    })
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

    const eventsData = await page.$$eval(
      '[class="div flex flex-col border-b border-solid border-neutral-700"]',
      (elements) =>
        elements.map((el) => {
          const aTag = el.querySelector("a")
          const title = aTag.textContent
          return {
            title: title,
            href: aTag.href,
          }
        })
    )
    console.group(`Found ${eventsData.length} bouts`)
    console.log("Group Info", eventsData)
    console.groupEnd()

    await Promise.all(eventsData.map((event) => getEventData(event, browser)))

    await browser.close()
  } catch (error) {
    console.error(error)
  }
}

/**
 *
 * @param {{
 * title: string,
 * href: string}} eventData
 * @param {Browser} browser
 */
const getEventData = async (eventData, browser) => {
  const eventPage = await browser.newPage()
  await eventPage.goto(eventData.href, {
    waitUntil: "networkidle2",
    timeout: 60000,
  })

  const date = await eventPage.$eval(
    '[class="div flex items-center justify-between text-xs uppercase font-bold text-tap_7f leading-none"]',
    (element) => {
      const spans = Array.from(element.querySelectorAll("span"))
      return spans.map((span) => span.textContent.trim())[1]
    }
  )

  const events = await eventPage.$$eval(
    '[data-event-view-toggle-target="list"]',
    (element) => {
      return element.length
    }
  )

  await delay(1000)
  await eventPage.close()
  console.groupCollapsed(eventData.title)
  console.log("Date of Event:", date)
  console.log("Number of Schedule bouts:", events)
  console.groupEnd()
}

main()
