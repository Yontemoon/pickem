import { useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { getEvent } from "@/lib/fetch"
import { CLIENT_URL } from "@/lib/constants"

type TFight = {
  id: number
  bout_number: number
  fight_info: {
    id: number
    corner: string
    fighter: { name: string }
  }[]
}

type TEventStreamPayload = TFight[] | null

function useFights(eventId: number) {
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)

  const query = useQuery({
    queryKey: ["fights", eventId],
    queryFn: () => getEvent(eventId),
    staleTime: 120000,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!eventId) return

    // Create SSE connection
    const es = new EventSource(`${CLIENT_URL}/event/stream/${eventId}`)
    eventSourceRef.current = es

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as TEventStreamPayload
        if (!data) return

        queryClient.setQueryData(["fights", eventId], data)
      } catch (err) {
        console.error("SSE parse error", err)
      }
    }

    es.onerror = () => {
      console.warn("SSE connection lost, retrying in 2s...")
      es.close()
      setTimeout(() => {
        eventSourceRef.current = new EventSource(`/stream/${eventId}`)
      }, 2000)
    }

    return () => {
      es.close()
    }
  }, [eventId, queryClient])

  return query
}

export { useFights }
