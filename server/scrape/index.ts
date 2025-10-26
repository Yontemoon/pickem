import puppeteer from "puppeteer-core"
import { TAPOLOGY_URL, TIMEOUT } from "../lib/constants.js"
import chromium from "@sparticuz/chromium-min"
import {
  convertStringToTimestamptz,
  delay,
  getFighterDetails,
} from "../lib/utils.js"
import { insertFighter, insertEvent } from "../lib/supabase.js"

const viewport = {
  deviceScaleFactor: 1,
  hasTouch: false,
  height: 1080,
  isLandscape: true,
  isMobile: false,
  width: 1920,
}

const isLocal = !process.env.AWS_REGION && !process.env.VERCEL
async function scrape() {
  console.log(process.env.AWS_REGION)
  console.log(process.env.VERCEL)
  const executablePath = isLocal
    ? (await import("puppeteer")).executablePath()
    : await chromium.executablePath()
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: viewport,
      executablePath: executablePath,
      headless: true,
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
        ;(select as HTMLSelectElement).value = "ufc"
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
          const event_title = aTag?.textContent
          const dateElement = el.querySelector("span[class='hidden md:inline']")
          const date = dateElement ? dateElement.textContent.trim() : null
          return {
            id: id,
            event_title: event_title || "",
            href: aTag?.href || "",
            date: date || "",
          }
        })
    )
    console.group(`Found ${eventsData.length} bouts`)

    eventsData.forEach(async (event) => {
      try {
        if (!event.date) {
          throw new Error("No date found")
        }
        const timeStamp = convertStringToTimestamptz(event.date)
        console.group(`Inserting event data for_: ${event.event_title}`)
        console.log("ID: ", event.id)
        console.log("Tag", event.href)
        console.log("Date", event.date)
        console.groupEnd()
        if (timeStamp && event.id && event.event_title) {
          const { error } = await insertEvent({
            date: timeStamp,
            id: event.id,
            event_title: event.event_title,
          })

          if (error) {
            throw new Error(error)
          }
        }
      } catch (error) {
        console.error(error)
      }
    })

    const data = await Promise.all(
      eventsData.map((event) => getEventData(event, browser))
    )

    let fightersScheduled = 0
    data.forEach((element) => {
      element?.forEach((event) => {
        console.group(event.details.fightId)
        console.log(`${event.fighter1.id}: ${event.fighter1.name}`)
        console.log(`${event.fighter2.id}: ${event.fighter2.name}`)
        console.groupEnd()
        fightersScheduled++
      })
    })
    console.log(`Number of bouts scheduled:`, fightersScheduled)

    data.forEach((event) => {
      event?.forEach(async (fight) => {
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

type TFighterDetails = {
  id: number
  name: string
  href: string
  imageSrc: string | null
  winLos: string
  flagSrc: string
}
const getEventData = async (
  eventData: {
    event_title: string
    href: string
  },
  browser: puppeteer.Browser
): Promise<
  | {
      fighter1: TFighterDetails
      fighter2: TFighterDetails
      details: {
        fightId: number | null
        weightClass: number | null
      }
    }[]
  | undefined
> => {
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

        if (!container) {
          return
        }

        const children = container.children
        const fighter1Element = children[0]
        const fightDetailElement = children[1]
        const fighter2Element = children[2]
        const fighter1Details = (await (window as any).getFighterDetails(
          fighter1Element
        )) as TFighterDetails
        const fighter2Details = (await (window as any).getFighterDetails(
          fighter2Element
        )) as TFighterDetails
        boutNum++

        /**
         * Get Fight details
         */

        const weightClass = fightDetailElement.querySelector(
          '[class="bg-tap_darkgold px-1.5 md:px-1 leading-[23px] text-sm md:text-[13px] text-neutral-50 rounded"]'
        )
        const fightUrl = fightDetailElement.querySelector("a")?.href
        const fightId = fightUrl?.split("/bouts/")[1].split("-")[0]

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
  console.groupCollapsed(eventData.event_title)
  console.log("Date of Event:", date)
  console.log("Scheduled Bouts details:", eventDetails)
  console.groupEnd()
  return eventDetails
}

export default scrape
