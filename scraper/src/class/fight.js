import supabase from "../lib/supabase.js"

class Fight {
  /**
   * Class for Fights.
   * @param {TFight}
   */
  constructor({ redFighter, blueFighter, details, event }) {
    this.redFighter = redFighter
    this.blueFighter = blueFighter
    this.details = details
    this.event = event
  }

  async insert() {
    try {
      const { error: insertFightsError } = await supabase
        .from("fights")
        .upsert({
          id: this.details.fightId,
          event_id: this.event.id,
          weight: this.details.weightClass,
          bout_number: this.details.boutNumber,
        })

      if (insertFightsError) {
        console.error(insertFightsError.message)
        throw new Error(insertFightsError)
      }
      const { error: insertRedError } = await supabase
        .from("fight_info")
        .upsert({
          fight_id: this.details.fightId,
          fighter_id: this.redFighter.id,
          is_winner: false,
          corner: "red",
        })

      if (insertRedError) {
        if (insertRedError.code === "23505") {
          console.info("Duplicate Fight ID and Fighter ID")
          return
        }

        console.error(insertRedError.message)
        throw new Error(insertRedError)
      }

      const { error: insertBlueError } = await supabase
        .from("fight_info")
        .upsert({
          fight_id: this.details.fightId,
          fighter_id: this.blueFighter.id,
          is_winner: false,
          corner: "blue",
        })

      if (insertBlueError) {
        if (insertBlueError.code === "23505") {
          console.info("Duplicate Fight ID and Fighter ID")
          return
        }

        console.error(insertBlueError.name)
        throw new Error(insertBlueError)
      }
    } catch (error) {
      console.error("ERROR: [Fight.insert]")
      console.error(error)
    }
  }
}

export default Fight
