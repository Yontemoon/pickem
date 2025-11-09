import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { getSupabase, supabaseMiddleware } from "../supabase/supabase.ts"
import { cors } from "hono/cors"

const app = new Hono()
app.use("*", supabaseMiddleware())
app.use("*", cors())

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.get("/events/upcoming", async (c) => {
  try {
    const supabase = getSupabase(c)

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date")

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

app.get("/event/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"))
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

// Picks based on user
app.get("/picks", async (c) => {})

app.post("/pick")

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
