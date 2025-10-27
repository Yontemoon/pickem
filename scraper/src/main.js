import puppeteer, { Browser } from "puppeteer"
import { TAPOLOGY_URL, TIMEOUT } from "./lib/constants.js"
import { delay } from "./lib/utils.js"
import Event from "./class/events.js"
import Fighter from "./class/fighter.js"

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
      eventsData.map((event) => getEventData(event, browser))
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

/**
 *
 * @param {{
 * event_title: string,
 * href: string}} eventData
 * @param {Browser} browser
 * @returns {Promise<Array<{
 *   fighter1: FighterDetails;
 *   fighter2: FighterDetails;
 *   details: {
 *     fightId: number | null;
 *     weightClass: number | null;
 *   };
 * }>>>}
 */
const getEventData = async (eventData, browser) => {
  const eventPage = await browser.newPage()
  await eventPage.goto(eventData.href, {
    waitUntil: "networkidle2",
    timeout: TIMEOUT,
  })

  const date = await eventPage.$eval(
    '[class="div flex items-center justify-between text-xs uppercase font-bold text-tap_7f leading-none"]',
    (element) => {
      const spans = Array.from(element.querySelectorAll("span"))
      return spans.map((span) => span.textContent.trim())[1]
    }
  )

  const eventDetails = await eventPage.$$eval(
    '[class="border-b border-dotted border-tap_6"][data-controller="table-row-background"]',
    (elements) => {
      const results = []
      let boutNum = 0

      for (const element of elements) {
        const container = element.querySelector(
          '[class="div group flex items:start justify-center gap-0.5 md:gap-0"]'
        )
        if (!container) continue

        const children = container.children
        const fighter1Element = children[0]
        const fightDetailElement = children[1]
        const fighter2Element = children[2]

        const getFighterDetails = (el) => {
          if (!el) return null

          const anchor = el.querySelector("a")
          const name = anchor?.textContent?.trim() || ""
          const href = anchor?.href || ""

          const ratioEl = el.querySelector('[class^="text-[15px] md:text-xs"]')
          const winLos = ratioEl?.textContent?.trim() || ""

          const flagEl = el.querySelector(
            'img[class="opacity-70 h-[14px] md:h-[11px] w-[22px] md:w-[17px]"]'
          )
          const flagSrc = flagEl?.src || ""

          const imageEl = el.querySelector('[id^="fighterBoutImage"] img')
          const imageSrc = imageEl?.src || ""

          const idMatch = imageSrc.match(
            /https:\/\/images\.tapology\.com\/headshot_images\/(\d+)\//
          )
          const id = idMatch ? Number(idMatch[1]) : null

          return { id, name, href, imageSrc, winLos, flagSrc }
        }

        const fighter1Details = getFighterDetails(fighter1Element)
        const fighter2Details = getFighterDetails(fighter2Element)
        boutNum++

        // fight details
        const weightClassEl = fightDetailElement.querySelector(
          '[class="bg-tap_darkgold px-1.5 md:px-1 leading-[23px] text-sm md:text-[13px] text-neutral-50 rounded"]'
        )
        const weightClass = weightClassEl?.textContent?.trim() || ""

        const fightAnchor = fightDetailElement.querySelector("a")
        const fightUrl = fightAnchor?.href || ""
        const fightIdMatch = fightUrl.match(/\/bouts\/(\d+)-/)
        const fightId = fightIdMatch ? Number(fightIdMatch[1]) : null

        results.push({
          fighter1: fighter1Details,
          fighter2: fighter2Details,
          details: {
            fightId,
            boutNumber: boutNum,
            weightClass,
          },
        })
      }

      return results
    }
  )

  await delay(1000)
  await eventPage.close()
  console.groupCollapsed(eventData.event_title)
  console.log("Date of Event:", date)
  console.log("Number of fights: ", eventDetails.length)
  console.groupEnd()
  return eventDetails
}

main()
