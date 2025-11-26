import { createServerClient, parseCookieHeader } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Context, MiddlewareHandler } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import type { Database } from "./database.types.js"
import "dotenv/config"

declare module "hono" {
  interface ContextVariableMap {
    supabase: SupabaseClient<Database>
  }
}

export const getSupabase = (c: Context) => {
  return c.get("supabase")
}

export const supabaseMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL missing!")
    }

    if (!supabaseAnonKey) {
      throw new Error("SUPABASE_PUBLISHABLE_KEY missing!")
    }

    const accessToken = getCookie(c, "sb-access-token")
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(c.req.header("Cookie") ?? "").filter(
              (cookie) => cookie.value !== undefined
            ) as { name: string; value: string }[]
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              setCookie(c, name, value, {
                ...options,
                sameSite:
                  options?.sameSite === true
                    ? "Strict"
                    : options?.sameSite === false
                    ? undefined
                    : options?.sameSite,
              })
            )
          },
        },
        global: {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        },
      }
    )

    c.set("supabase", supabase)

    await next()
  }
}
