import { insertFighter } from "../lib/supabase.js"

/**
 * @typedef {object} FighterType
 * @property {string} id
 * @property {string} name
 * @property {string} href
 * @property {string} imageSrc
 * @property {string} winLos
 * @property {string} flagSrc
 */

/**
 * @class
 */

class Fighter {
  /**
   * @param {FighterType}
   */
  constructor({ id, name, href, imageSrc, winLos, flagSrc }) {
    this.id = id
    this.name = name
    this.href = href
    this.imageSrc = imageSrc
    this.winLos = winLos
    this.flagSrc = flagSrc
  }

  async insert() {
    try {
      const { error } = await insertFighter({
        id: this.id,
        name: this.name,
        ratio: this.winLos,
        tapology_flag_src: this.flagSrc,
        tapology_img_url: this.imageSrc,
        tapology_link: this.href,
      })

      if (error) {
        throw new Error(error)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

export default Fighter
