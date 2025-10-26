import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { getSupabase, supabaseMiddleware } from "../supabase/supabase.js"
import scrape from "../scrape/index.js"
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
      console.error("GET [/events/upcoming]: ", error)
    }
    return c.json({ data: data, error: null })
  } catch (err) {
    console.error(err)
    return c.json({ data: null, error: err })
  }
})

app.post("/cronjob", async (c) => {
  await scrape()
  return c.json({
    complete: true,
  })
})
serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)
