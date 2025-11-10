// import React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { CLIENT_URL } from "@/lib/constants"
import { Link } from "@tanstack/react-router"
import { z } from "zod"
import type { TFight } from "@/types/supabase.types"
import { Button } from "@/components/ui/button"

const ZSearchParamSchema = z.object({
  event: z.number().optional(),
})

export const Route = createFileRoute("/")({
  component: App,

  validateSearch: ZSearchParamSchema,
  pendingComponent: () => <div className="text-center">Loading...</div>,
  staleTime: 120000,
  async loader() {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/events/upcoming`
    )
    const data = (await response.json()) as {
      data:
        | {
            id: number
            created_at: string
            event_title: string
            date: string
          }[]
        | null
      error: string | null
    }
    return data
  },
})

function App() {
  const { data, error } = Route.useLoaderData()

  const params = Route.useSearch()

  const { data: eventData, isPending } = useQuery({
    queryKey: ["fights", params.event],
    staleTime: 120000,
    queryFn: async () => {
      const res = await fetch(`${CLIENT_URL}/event/${params.event}`)
      const { data, error } = await res.json()
      if (error) {
        throw Error(error)
      }
      return data as TFight[] | []
    },
  })

  return (
    <div className="text-center mx-10 px-2">
      {error && <div>{JSON.stringify(error)}</div>}
      {data &&
        data.map((d) => {
          return (
            <Link
              key={d.id}
              preload="intent"
              to="/"
              search={{
                event: d.id,
              }}
            >
              <div>{d.event_title}</div>
            </Link>
          )
        })}
      <div>
        {isPending && <div>Loading...</div>}
        <div className="grid">
          {eventData?.map((event) => {
            return (
              <div key={event.id} className="grid grid-cols-3 space-y-2">
                <Button>{event.fight_info[0].fighter.name}</Button>
                <div>{event.bout_number}</div>
                <Button>{event.fight_info[1].fighter.name}</Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
