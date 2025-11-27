import React from "react"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { TPick } from "@/types/supabase.types"
import { Button } from "@/components/ui/button"
import { getUpcomingEvents, getPick, getEvent, postPick } from "@/lib/fetch"
import { ZSearchParamAppSchema } from "@/lib/zod"

type TUserPick = {
  fight_id: number
  fighter_id: number
}

export const Route = createFileRoute("/app")({
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

  React.useEffect(() => {
    if (data && !params.event) {
      navigate({
        search: { event: data[0].id },
      })
    }
  }, [])

  const queryClient = useQueryClient()
  const { data: eventData, isPending } = useQuery({
    queryKey: ["fights", params.event],
    staleTime: 120000,
    queryFn: async () => {
      if (params.event) {
        const data = await getEvent(params.event)
        return data
      }
    },
  })

  const { data: picks } = useQuery({
    queryFn: async () => {
      const { data } = await getPick()
      return data
    },
    queryKey: ["user-picks"],
  })

  const pickIds = picks?.map((pick) => pick.fighter_id)

  const reformattedData = eventData?.data?.map((fight) => {
    const modifiedFights = fight.fight_info?.map((fighter) => {
      const foundPick = pickIds?.includes(fighter.id)

      return { ...fighter, isPicked: foundPick }
    })
    return { ...fight, fight_info: modifiedFights }
  })

  const { mutate } = useMutation<
    { success: boolean },
    { message: string; statusCode: number },
    TUserPick
  >({
    mutationFn: async ({ fight_id, fighter_id }) => {
      return postPick(fighter_id, fight_id)
    },
    onMutate: async (userPick) => {
      await queryClient.cancelQueries({ queryKey: ["user-picks"] })
      const prevPicks = queryClient.getQueryData(["user-picks"])

      queryClient.setQueryData(["user-picks"], (old: TPick[]) => {
        const removedFight = old.filter(
          (pick) => pick.fight_id !== userPick.fight_id,
        )

        const prevPick = old.find((pick) => pick.fight_id === userPick.fight_id)
        return [
          ...removedFight,
          { ...prevPick, fighter_id: userPick.fighter_id },
        ]
      })

      return prevPicks
    },
    onError: (_err, _newPick, context) => {
      queryClient.setQueryData(["user-picks"], context)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["user-picks"] })
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
              to="/app"
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
          {reformattedData?.map((fight) => {
            return (
              <div key={fight.id} className="grid grid-cols-3 space-y-2">
                <Button
                  variant={fight.fight_info[0].isPicked ? "third" : "default"}
                  onClick={() => {
                    mutate({
                      fight_id: fight.id,
                      fighter_id: fight.fight_info[0].id,
                    })
                  }}
                >
                  {fight.fight_info[0].fighter.name}
                </Button>
                <div>{fight.bout_number}</div>
                <Button
                  variant={fight.fight_info[1].isPicked ? "third" : "secondary"}
                  onClick={() => {
                    mutate({
                      fight_id: fight.id,
                      fighter_id: fight.fight_info[1].id,
                    })
                  }}
                >
                  {fight.fight_info[1].fighter.name}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
