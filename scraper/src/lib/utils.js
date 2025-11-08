import dotenv from "dotenv"
import { DateTime } from "luxon"

const dotenvResults = dotenv.config({
  quiet: true,
})
if (dotenvResults.error) {
  if (
    process.env.NODE_ENV === "production" &&
    dotenvResults.error.code === "ENOENT"
  ) {
    console.info(
      "expected this error because we are in production without a .env file"
    )
  } else {
    throw result.error
  }
}

/**
 *
 * @param { string } time
 * @returns { Promise<void>}
 */
const delay = async (time) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, time)
  })
}

/**
 * Converts a date string like "January 25, 5:30 PM ET"
 * to a future ISO timestamp (e.g., next year's January if already passed).
 *
 * @param {string} rawString
 * @returns {string | null}
 */
const convertStringToTimestamptz = (rawString) => {
  const cleaned = rawString.replace(/\s+/g, " ").trim()
  const noDay = cleaned.replace(/^[A-Za-z]+,\s*/, "")
  const withZone = noDay.replace(/\sET$/, " America/New_York")

  // Parse month/day/time/zone
  let dt = DateTime.fromFormat(withZone, "MMMM d, h:mm a z", {
    zone: "America/New_York",
  })

  if (!dt.isValid) return null

  const now = DateTime.now().setZone("America/New_York")

  // If parsed date has no year, assume this year first
  dt = dt.set({ year: now.year })

  // If that date/time is already in the past, roll to next year
  if (dt < now) {
    dt = dt.plus({ year: 1 })
  }

  return dt.toISO()
}

export { delay, convertStringToTimestamptz }
