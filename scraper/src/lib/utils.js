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
 *
 * @param {string} rawString
 * @returns { string| null }
 */
const convertStringToTimestamptz = (rawString) => {
  const cleaned = rawString.replace(/\s+/g, " ").trim()
  const noDay = cleaned.replace(/^[A-Za-z]+,\s*/, "")
  const withZone = noDay.replace(/\sET$/, " America/New_York")
  const dt = DateTime.fromFormat(withZone, "MMMM d, h:mm a z", {
    zone: "America/New_York",
  })

  const timestamp = dt.toISO()
  return timestamp
}

export { delay, convertStringToTimestamptz }
