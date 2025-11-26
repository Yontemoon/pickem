import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { getSupabase, supabaseMiddleware } from "../supabase/supabase.js"
import { cors } from "hono/cors"
import authRoutes from "@/routes/auth.js"
import picksHono from "./routes/pick.js"
import eventRoutes from "@/routes/event.js"

const app = new Hono()
app.use("*", supabaseMiddleware())
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "https://pickem.monteyoon.com"],
    credentials: true,
  })
)

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.route("/auth", authRoutes)
app.route("/picks", picksHono)
app.route("event", eventRoutes)

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
