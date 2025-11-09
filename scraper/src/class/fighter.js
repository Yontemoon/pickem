import { insertFighter } from "../lib/supabase.js"

/**
 * @class
 */

class Fighter {
  /**
   * @param {TFighter}
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
