import puppeteer, { Browser } from "puppeteer"
import { TAPOLOGY_URL, TIMEOUT } from "./lib/constants.js"
import {
  convertStringToTimestamptz,
  delay,
  getFighterDetails,
} from "./lib/utils.js"
import { insertFighter, insertEvent } from "./lib/supabase.js"

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

    eventsData.forEach(async (event) => {
      try {
        const timeStamp = convertStringToTimestamptz(event.date)
        console.group(`Inserting event data for: ${event.event_title}`)
        console.log("ID: ", event.id)
        console.log("Tag", event.href)
        console.log("Date", event.date)
        console.groupEnd()
        const { error } = await insertEvent({
          date: timeStamp,
          id: event.id,
          event_title: event.event_title,
        })

        if (error) {
          throw new Error(error)
        }
      } catch (error) {
        console.error(error)
      }
    })

    const data = await Promise.all(
      eventsData.map((event) => getEventData(event, browser))
    )

    // let fightersScheduled = 0
    // data.forEach((element) => {
    //   element.forEach((event) => {
    //     console.group(event.details.fightId)
    //     console.log(`${event.fighter1.id}: ${event.fighter1.name}`)
    //     console.log(`${event.fighter2.id}: ${event.fighter2.name}`)
    //     console.groupEnd()
    //     fightersScheduled++
    //   })
    // })
    // console.log(`Number of bouts scheduled:`, fightersScheduled)

    data.forEach((event) => {
      event.forEach(async (fight) => {
        await insertFighter({
          id: fight.fighter1.id,
          name: fight.fighter1.name,
          ratio: fight.fighter1.winLos,
          tapology_flag_src: fight.fighter1.flagSrc,
          tapology_img_url: fight.fighter1.imageSrc,
          tapology_link: fight.fighter1.href,
        })
        await insertFighter({
          id: fight.fighter2.id,
          name: fight.fighter2.name,
          ratio: fight.fighter2.winLos,
          tapology_flag_src: fight.fighter2.flagSrc,
          tapology_img_url: fight.fighter2.imageSrc,
          tapology_link: fight.fighter2.href,
        })
      })
    })

    await browser.close()
  } catch (error) {
    console.error(error)
  }
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
 * title: string,
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
  await eventPage.exposeFunction("getFighterDetails", getFighterDetails)
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
    async (elements) => {
      const results = []
      let boutNum = 0
      for (let element of elements) {
        const container = element.querySelector(
          '[class="div group flex items:start justify-center gap-0.5 md:gap-0"]'
        )
        const children = container.children
        const fighter1Element = children[0]
        const fightDetailElement = children[1]
        const fighter2Element = children[2]
        const fighter1Details = await window.getFighterDetails(fighter1Element)
        const fighter2Details = await window.getFighterDetails(fighter2Element)
        boutNum++

        /**
         * Get Fight details
         */

        const weightClass = fightDetailElement.querySelector(
          '[class="bg-tap_darkgold px-1.5 md:px-1 leading-[23px] text-sm md:text-[13px] text-neutral-50 rounded"]'
        )
        const fightUrl = fightDetailElement.querySelector("a").href
        const fightId = fightUrl.split("/bouts/")[1].split("-")[0]

        results.push({
          fighter1: fighter1Details,
          fighter2: fighter2Details,
          details: {
            fightId: fightId ? Number(fightId) : null,
            boutNumber: boutNum,
            weightClass: weightClass
              ? Number(weightClass.textContent.trim())
              : null,
          },
        })
      }

      return results
    }
  )

  await delay(1000)
  await eventPage.close()
  console.groupCollapsed(eventData.title)
  console.log("Date of Event:", date)
  console.log("Scheduled Bouts details:", eventDetails)
  console.groupEnd()
  return eventDetails
}

main()
