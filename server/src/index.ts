import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { getSupabase, supabaseMiddleware } from "../supabase/supabase.js"
import { cors } from "hono/cors"
import authRoutes from "./routes/auth.js"
import { getCookie } from "hono/cookie"
import authMiddleware from "./middleware/auth.js"
import picksHono from "./routes/pick.js"

const app = new Hono()
app.use("*", supabaseMiddleware())
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "https://pickem-production.up.railway.app",
    ],
    credentials: true,
  })
)

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.route("/auth", authRoutes)
app.route("/picks", picksHono)

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
    if (!id) {
      return c.json({ error: "No Id" })
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

serve(
  {
    fetch: app.fetch,
    port: 3001,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  }
)

export default app
