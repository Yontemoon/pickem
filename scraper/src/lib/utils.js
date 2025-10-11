import dotenv from "dotenv"

const dotenvResults = dotenv.config()
if (dotenvResults.error) {
  throw new dotenvResults.error()
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

export { delay, getFighterDetails }
