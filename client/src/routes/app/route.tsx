// import React from "react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { CLIENT_URL } from "@/lib/constants"
import { Link } from "@tanstack/react-router"
import { z } from "zod"
import type { TFight, TPicks } from "@/types/supabase.types"
import { Button } from "@/components/ui/button"

const ZSearchParamSchema = z.object({
  event: z.number().optional(),
})

type TUserPick = {
  fight_id: number
  fighter_id: number
}

export const Route = createFileRoute("/app")({
  component: App,

  validateSearch: ZSearchParamSchema,
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
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/event/upcoming`,
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
  const queryClient = useQueryClient()

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

  const { data: picks } = useQuery<TPicks[]>({
    queryFn: async () => {
      const resTest = await fetch(`${import.meta.env.VITE_API_URL}/picks`, {
        credentials: "include",
      })
      const test = await resTest.json()

      return test
    },
    queryKey: ["user-picks"],
  })

  const pickIds = picks?.map((pick) => pick.fighter_id)

  const reformattedData = eventData?.map((fight) => {
    const modifiedFights = fight.fight_info.map((fighter) => {
      const foundPick = pickIds?.includes(fighter.id)

      return { ...fighter, isPicked: foundPick }
    })
    return { ...fight, fight_info: modifiedFights }
  })

  const updatePicks = async (fighter_id: number, fight_id: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/picks`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          fighter_id,
          fight_id,
        }),
      })
      const updatePick = (await res.json()) as {
        message: string
        success: boolean
      }
      return updatePick.success
    } catch (err) {
      return false
    }
  }
  const { mutate } = useMutation<
    { success: boolean },
    { message: string; statusCode: number },
    TUserPick
  >({
    mutationFn: async ({ fight_id, fighter_id }) => {
      const res = (await updatePicks(fighter_id, fight_id)) as boolean
      return { success: res }
    },
    onMutate: async (userPick) => {
      await queryClient.cancelQueries({ queryKey: ["user-picks"] })
      const prevPicks = queryClient.getQueryData(["user-picks"])

      queryClient.setQueryData(["user-picks"], (old: TPicks[]) => {
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
