import { Hono } from "hono"
import { getSupabase } from "../../supabase/supabase.js"

const eventRoutes = new Hono()

eventRoutes.get("/upcoming", async (c) => {
  try {
    const supabase = getSupabase(c)
    const date = new Date()
    date.setDate(date.getDate() + 1)
    const timestamp = date.toISOString()
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date")
      .gt("date", timestamp)

    if (error) {
      console.error("GET [/events/upcoming]: ", error.message)
      throw new Error(error.message)
    }
    return c.json({ data: data, error: null })
  } catch (err) {
    console.error(err)
    return c.json({ data: null, error: err })
  }
})

eventRoutes.get("/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"))
    if (!id) {
      return c.json({ error: "No Id", data: null })
    }

    const supabase = getSupabase(c)

    const { data, error } = await supabase
      .from("fights")
      .select("*, fight_info(id, corner, fighter(name))")
      .eq("event_id", id)
      .order("bout_number")
    if (error) {
      console.error(`GET [/event/${id}]`, error.message)
      console.error(error)
      throw new Error(error.message)
    }

    return c.json({ data: data, error: null })
  } catch (err) {
    console.error(err)
    return c.json({
      error: err,
      data: null,
    })
  }
})

export default eventRoutes
