import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: App,
  async loader() {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/events/upcoming`
    )
    const data = await response.json()

    return data as {
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
  },
})

function App() {
  const { data, error } = Route.useLoaderData()
  return (
    <div className="text-center">
      {error && <div>{JSON.stringify(error)}</div>}
      {data &&
        data.map((d) => {
          return <div>{d.event_title}</div>
        })}
    </div>
  )
}
