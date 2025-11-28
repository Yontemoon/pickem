import { Hono } from "hono"
import { getSupabase } from "../../supabase/supabase.js"
import type { SupabaseClient } from "@supabase/supabase-js"
import { stream, streamText, streamSSE } from "hono/streaming"

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

// =============================
// GLOBAL SERVER MEMORY
// =============================
const eventCache = new Map<number, any>()
const eventIntervals = new Map<number, NodeJS.Timeout>()
const eventClientCount = new Map<number, number>()

async function startPollingEvent(eventId: number, supabase: SupabaseClient) {
  // Already polling? Do nothing.
  if (eventIntervals.has(eventId)) return

  // Start interval
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from("fights")
      .select("*, fight_info(id, corner, fighter(name))")
      .eq("event_id", eventId)
      .order("bout_number")

    eventCache.set(eventId, data)
    console.log(`Polling event ${eventId}`)
    console.log(eventCache.size)
  }, 10_000)

  eventIntervals.set(eventId, interval)
}

function stopPollingEvent(eventId: number) {
  const interval = eventIntervals.get(eventId)
  if (interval) {
    clearInterval(interval)
    eventIntervals.delete(eventId)

    // Do we need to delete the eventCache?
    eventCache.delete(eventId)
  }
}

// =============================
// SSE ROUTE
// =============================
eventRoutes.get("/stream/:id", async (c) => {
  const id = Number(c.req.param("id"))
  const supabase = getSupabase(c)

  // Increase client count
  const current = eventClientCount.get(id) ?? 0
  eventClientCount.set(id, current + 1)

  // Initial fetch
  const { data } = await supabase
    .from("fights")
    .select("*, fight_info(id, corner, fighter(name))")
    .eq("event_id", id)
    .order("bout_number")

  eventCache.set(id, data)

  // Start polling if this is the first client
  startPollingEvent(id, supabase)
  return streamSSE(c, async (stream) => {
    // Register disconnect listener FIRST (only once)
    stream.onAbort(() => {
      const now = (eventClientCount.get(id) ?? 1) - 1

      if (now <= 0) {
        eventClientCount.delete(id)
        stopPollingEvent(id)
        console.log(`Stopped polling event ${id}`)
      } else {
        eventClientCount.set(id, now)
      }
    })

    // Then write the loop
    while (true) {
      await stream.writeSSE({
        data: JSON.stringify({
          data: eventCache.get(id),
          error: null,
        }),
      })

      await stream.sleep(5000)
    }
  })
})

export default eventRoutes
