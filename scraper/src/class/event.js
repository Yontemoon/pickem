import { insertEvent } from "../lib/supabase.js"
import { convertStringToTimestamptz } from "../lib/utils.js"

class Event {
  /**
   * @param {TEvent} eventParam
   */
  constructor({ event_title, date, href, id }) {
    this.event_title = event_title
    this.date = convertStringToTimestamptz(date)
    this.href = href
    this.id = id
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

      console.group(`Inserting event data for: ${this.event_title}`)
      console.log(`Date occuring: ${this.date}`)
      console.groupEnd()
    } catch (err) {
      console.error(err)
    }
  }
}

export default Event
