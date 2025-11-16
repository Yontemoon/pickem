import { Hono } from "hono"
import authMiddleware from "../middleware/auth.js"
import { getSupabase } from "../../supabase/supabase.js"
import { getCookie } from "hono/cookie"

const picksHono = new Hono()

picksHono.get("/", authMiddleware, async (c) => {
  const supabase = getSupabase(c)
  const token = getCookie(c, "sb-access-token")
  const { data: user } = await supabase.auth.getClaims(token)

  const { data, error } = await supabase
    .from("user_picks")
    .select("*")
    .eq("user_id", user?.claims.sub!)

  return c.json(data)
})

picksHono.post("/", authMiddleware, async (c) => {
  const { fight_id, fighter_id } = await c.req.json()

  if (!fight_id || !fighter_id) {
    c.json({ success: false, message: "No fighter_id or fight_id" })
  }

  const token = getCookie(c, "sb-access-token")
  const supabase = getSupabase(c)
  const { data: user } = await supabase.auth.getClaims(token)

  const userId = user?.claims.sub!

  const { error } = await supabase.from("user_picks").upsert(
    {
      fighter_id,
      fight_id,
      user_id: userId,
    },
    {
      onConflict: "fight_id,user_id",
      ignoreDuplicates: false,
    }
  )

  if (error) {
    console.error(error)
    console.error("upsert error:", error.message)
    return c.json({ success: false, message: "upsert error occured." })
  }

  return c.json({ success: true, message: "Created new pick" })
})
export default picksHono
