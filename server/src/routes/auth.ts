import { Hono } from "hono"
import supabase from "../../lib/supabase.js"
import { setCookie, deleteCookie, getCookie } from "hono/cookie"
import { getSupabase } from "../../supabase/supabase.js"
import authMiddleware from "../middleware/auth.js"
import { ONE_HOUR, ONE_WEEK } from "../../lib/constants.js"

const authRoutes = new Hono()

// --- LOGIN ROUTE ---
authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.log(error)
    return c.json({ error: error.message, user: null }, 401)
  }

  const { session } = data
  const isProd = process.env.NODE_ENV === "production"

  // Set access + refresh tokens as cookies
  setCookie(c, "sb-access-token", session.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? ".monteyoon.com" : undefined,
    path: "/",
    maxAge: 60 * 60,
    // partitioned: isProd ? true : false,
  })

  setCookie(c, "sb-refresh-token", session.refresh_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    domain: isProd ? ".monteyoon.com" : undefined,
    maxAge: ONE_WEEK,
    // partitioned: isProd ? true : false,
  })

  return c.json({ user: session.user })
})

authRoutes.post("/signup", async (c) => {
  try {
    const { email, password } = await c.req.json()
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) {
      console.error(error)
      throw new Error(error.message)
    }

    const { session } = data

    if (!session) {
      throw new Error("No session found")
    }
    const isProd = process.env.NODE_ENV === "production"
    // Set access + refresh tokens as cookies
    setCookie(c, "sb-access-token", session.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      domain: isProd ? ".monteyoon.com" : undefined,
      path: "/",
      maxAge: 60 * 60,
      // partitioned: isProd ? true : false,
    })

    setCookie(c, "sb-refresh-token", session.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      domain: isProd ? ".monteyoon.com" : undefined,
      maxAge: ONE_WEEK,
      // partitioned: isProd ? true : false,
    })

    return c.json({ user: data.user, error: null })
  } catch (error) {
    console.error(error)
    return c.json({ error: error, user: null })
  }
})

authRoutes.post("/logout", authMiddleware, async (c) => {
  try {
    deleteCookie(c, "sb-access-token")
    deleteCookie(c, "sb-refresh-token")
    return c.json({ success: true, error: null })
  } catch (error) {
    console.error("Error signing out", error)
    c.json({ success: false, error: error })
  }
})

authRoutes.get("/user", authMiddleware, async (c) => {
  try {
    const token = getCookie(c, "sb-access-token")

    if (!token) {
      return c.json({ error: "No token found", data: null })
    }

    const supabase = getSupabase(c)

    const { data, error } = await supabase.auth.getClaims(token)

    if (error) {
      console.log(error)
      throw Error(error.message)
    }

    return c.json({ error: null, data: data?.claims })
  } catch (error) {
    console.error(error)
    return c.json({ data: null, error: error })
  }
})

export default authRoutes
