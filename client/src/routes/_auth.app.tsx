import React from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { TPick } from "@/types/supabase.types"
import { Button } from "@/components/ui/button"
import { getUpcomingEvents, getPick, postPick } from "@/lib/fetch"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ZSearchParamAppSchema } from "@/lib/zod"
import { cn } from "@/lib/utils"
import { useFights } from "@/hooks/use-fights"

type TUserPick = {
  fight_id: number
  fighter_id: number
}

export const Route = createFileRoute("/_auth/app")({
  component: App,
  validateSearch: ZSearchParamAppSchema,
  pendingComponent: () => <div className="text-center">Loading...</div>,
  staleTime: 120000,
  beforeLoad: async ({ context }) => {
    const isAuth = context.auth.isAuthenticated
    if (!isAuth) {
      throw redirect({
        to: "/signin",
      })
    }
  },
  async loader() {
    const res = await getUpcomingEvents()
    return res
  },
})

function App() {
  const { data, error } = Route.useLoaderData()
  const params = Route.useSearch()
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (data && !params.event) {
      navigate({ search: { event: data[0].id } })
    }
  }, [])

  const { data: eventData, isPending } = useFights(params.event!)
  console.log(eventData)

  const { data: picks } = useQuery({
    queryKey: ["user-picks"],
    queryFn: async () => (await getPick()).data,
  })

  const pickIds = picks?.map((p) => p.fighter_id)
  const currentEvent = data?.find((e) => e.id === params.event)

  const eventStart = currentEvent ? new Date(currentEvent.date) : null

  const [now, setNow] = React.useState(Date.now())

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const fightDeadline = eventStart?.getTime() ?? 0
  const msLeft = fightDeadline - now
  const isLocked = msLeft <= 0

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "Event started"

    const days = Math.floor(ms / (1000 * 60 * 60 * 24))
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const seconds = Math.floor((ms / 1000) % 60)

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`
    }

    return `${hours}h ${minutes}m ${seconds}s`
  }
  const reformattedData = eventData?.data?.map((fight) => {
    const modified = fight.fight_info?.map((f) => ({
      ...f,
      isPicked: pickIds?.includes(f.id),
    }))
    return { ...fight, fight_info: modified }
  })

  const { mutate } = useMutation({
    mutationFn: async (payload: TUserPick) =>
      postPick(payload.fighter_id, payload.fight_id),
    onMutate: async (userPick) => {
      await queryClient.cancelQueries({ queryKey: ["user-picks"] })
      const prev = queryClient.getQueryData(["user-picks"])
      queryClient.setQueryData(["user-picks"], (old: TPick[]) => {
        const removed = old.filter((p) => p.fight_id !== userPick.fight_id)
        const prevPick = old.find((p) => p.fight_id === userPick.fight_id)
        return [...removed, { ...prevPick, fighter_id: userPick.fighter_id }]
      })
      return prev
    },
    onError: (_err, _newVal, ctx) =>
      queryClient.setQueryData(["user-picks"], ctx),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["user-picks"] }),
  })

  return (
    <div>
      {error && <div>{JSON.stringify(error)}</div>}

      <ScrollArea className="flex items-center gap-3 overflow-x-auto ">
        <div className="flex w-max space-x-4 p-2">
          {data?.map((ev) => (
            <Link
              key={ev.id}
              to="/app"
              preload="intent"
              search={{ event: ev.id }}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-md cursor-pointer text-sm hover:bg-accent transition",
                ev.id === params.event &&
                  "bg-primary text-primary-foreground underline",
              )}
            >
              {ev.event_title}
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      <div className="border" />

      {/* EVENT HEADER */}
      {currentEvent && (
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{currentEvent.event_title}</h1>
          <div className="text-muted-foreground">
            {new Date(currentEvent.date).toLocaleString()}
          </div>

          <div className="inline-block mt-2 px-4 py-2 rounded bg-accent text-accent-foreground">
            <span className="font-semibold">Time left: </span>
            {formatCountdown(eventStart!.getTime() - now)}
          </div>
        </div>
      )}

      {/* FIGHT CARDS */}
      <div className="space-y-5 max-w-3xl mx-auto px-4">
        {isPending && <div className="text-center">Loading...</div>}

        {reformattedData?.map((fight) => {
          return (
            <Card key={fight.id} className="">
              <CardHeader className="flex items-center justify-between mb-3">
                <CardTitle className=" ">Bout #{fight.bout_number}</CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-3 items-center gap-4">
                <Button
                  disabled={isLocked}
                  variant={fight.fight_info[0].isPicked ? "third" : "default"}
                  className="text-sm"
                  onClick={() =>
                    mutate({
                      fight_id: fight.id,
                      fighter_id: fight.fight_info[0].id,
                    })
                  }
                >
                  {fight.fight_info[0].fighter.name}
                </Button>

                <div className="text-center text-muted-foreground text-sm">
                  vs
                </div>

                <Button
                  disabled={isLocked}
                  variant={fight.fight_info[1].isPicked ? "third" : "secondary"}
                  className="text-sm"
                  onClick={() =>
                    mutate({
                      fight_id: fight.id,
                      fighter_id: fight.fight_info[1].id,
                    })
                  }
                >
                  {fight.fight_info[1].fighter.name}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
