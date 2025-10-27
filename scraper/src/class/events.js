import { insertEvent } from "../lib/supabase.js"
import { convertStringToTimestamptz } from "../lib/utils.js"

/**
 * @typedef {object} EventType
 * @property {string} event_title
 * @property {string} date
 * @property {string} href
 * @property {string} id
 */

/**
 * Represents a Event.
 * @class
 */
class Event {
  /**
   *
   * @param {EventType}
   */
  constructor({ event_title, date, href, id }) {
    this.event_title = event_title
    this.date = convertStringToTimestamptz(date)
    this.href = href
    this.id = id
  }

  log() {
    console.group(`Inserting event data for: ${this.event_title}`)
    console.log("ID: ", this.id)
    console.log("Tag", this.href)
    console.log("Date", this.date)
    console.groupEnd()
  }

  async insert() {
    try {
      const { error } = await insertEvent({
        date: this.date,
        id: this.id,
        event_title: this.event_title,
      })
      if (error) {
        throw new Error(error)
      }
    } catch (err) {
      console.error(err)
    }
  }
}

export default Event
