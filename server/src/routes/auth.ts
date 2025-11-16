import { Hono } from "hono"
import supabase from "../../lib/supabase.js"
import { setCookie, deleteCookie } from "hono/cookie"
// import { accepts } from "hono/accepts"
// import authMiddleware from "../middleware/auth.js"

const authRoutes = new Hono()

// --- LOGIN ROUTE ---
authRoutes.post("/login", async (c) => {
  const { email, password } = await c.req.json()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  console.log(data)

  if (error) {
    return c.json({ error: error.message }, 401)
  }

  const { session } = data
  const isProd = process.env.NODE_ENV === "production"

  // Set access + refresh tokens as cookies
  setCookie(c, "sb-access-token", session.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? "https://pickem-production.up.railway.app" : undefined,
    path: "/",
    maxAge: 60 * 60, // 1 hour
    partitioned: isProd ? true : false,
  })

  setCookie(c, "sb-refresh-token", session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: isProd ? "none" : "lax",
    path: "/",
    domain: isProd ? "https://pickem-production.up.railway.app" : undefined,
    maxAge: 60 * 60 * 24 * 7, // 1 week
    partitioned: isProd ? true : false,
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

    setCookie(c, "sb-access-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60, // 1 hour
    })

    setCookie(c, "sb-refresh-token", session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    })
    return c.json({ user: data.user })
  } catch (error) {
    console.error(error)
    return c.json({ error: error })
  }
})

authRoutes.post("/signout", async (c) => {
  try {
    deleteCookie(c, "sb-access-token")
    deleteCookie(c, "sb-refresh-token")
    return c.json({ success: true })
  } catch (error) {
    console.error("Error signing out", error)
    c.json({ succes: false })
  }
})

export default authRoutes
