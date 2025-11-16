import type { Context, Next } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import { getSupabase } from "../../supabase/supabase.js"

const authMiddleware = async (c: Context, next: Next) => {
  const token = getCookie(c, "sb-access-token")
  const refreshToken = getCookie(c, "sb-refresh-token")

  if (!token && !refreshToken) {
    return c.text("Unauthorized", 401)
  }

  const supabase = getSupabase(c)

  const { data, error } = await supabase.auth.getClaims(token)

  if (error) {
    console.error(error)
    return c.text("Something went wrong")
  }

  if (!data && refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    const { session } = data

    if (!session || error) {
      return c.text("Refresh token is expired", 401)
    }

    if (session) {
      const isProd = process.env.NODE_ENV === "production"
      setCookie(c, "sb-access-token", session.access_token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        domain: isProd ? ".monteyoon.com" : undefined,
        path: "/",
        maxAge: 60 * 60, // 1 hour
        partitioned: isProd ? true : false,
      })
    }
  }

  await next()
}

export default authMiddleware
