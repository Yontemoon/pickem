import dotenv from "dotenv"
import { DateTime } from "luxon"

const dotenvResults = dotenv.config({
  quiet: true,
})
if (dotenvResults.error) {
  if (process.env.NODE_ENV === "production" && result.error.code === "ENOENT") {
    console.info(
      "expected this error because we are in production without a .env file"
    )
  } else {
    throw result.error
  }
}

const delay = (time) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
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
 * @param {Element} element
 * @returns {Promise<FighterDetails>}
 */
const getFighterDetails = async (element) => {
  const details = await element.evaluate((el) => {
    const anchor = el.querySelector("a")
    const name = anchor?.textContent || ""
    const href = anchor?.href || ""
    const ratio = el
      .querySelector('[class^="text-[15px] md:text-xs"]')
      .textContent.trim()

    const flagSrc = el.querySelector(
      'img[class="opacity-70 h-[14px] md:h-[11px] w-[22px] md:w-[17px]"]'
    ).src
    const imageSrc = el
      .querySelector('[id^="fighterBoutImage"]')
      .querySelector("img").src

    const id = imageSrc
      .split("https://images.tapology.com/headshot_images/")[1]
      .split("/")[0]

    return {
      id: id ? Number(id) : null,
      name,
      href,
      imageSrc: imageSrc,
      winLos: ratio,
      flagSrc: flagSrc,
    }
  })
  return details
}

const convertStringToTimestamptz = (rawString) => {
  // Clean up irregular spaces
  const cleaned = rawString.replace(/\s+/g, " ").trim()
  // Remove the day name
  const noDay = cleaned.replace(/^[A-Za-z]+,\s*/, "")
  // Replace timezone abbreviation with a real zone
  const withZone = noDay.replace(/\sET$/, " America/New_York")

  // Now parse
  const dt = DateTime.fromFormat(withZone, "MMMM d, h:mm a z", {
    zone: "America/New_York",
  })

  // Convert to Postgres-friendly timestamptz ISO string
  const timestamp = dt.toISO() // or dt.toISO({ suppressMilliseconds: true })
  return timestamp
}

export { delay, getFighterDetails, convertStringToTimestamptz }
