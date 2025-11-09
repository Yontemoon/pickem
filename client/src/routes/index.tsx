// import React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { CLIENT_URL } from "@/lib/constants"
import { Link } from "@tanstack/react-router"
import { z } from "zod"

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
      const data = await res.json()
      return data
    },
  })

  return (
    <div className="text-center">
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
        {JSON.stringify(eventData)}
      </div>
    </div>
  )
}
