import type { TEvent, TFight, TPick } from "@/types/supabase.types"
import { CLIENT_URL } from "./constants"

type ApiResponse<T> = {
  data: T | null
  error: string | null
}

type MutationResponse = {
  success: boolean
  message: string | null
}

const defaultFetchOptions: RequestInit = {
  credentials: "include",
}

const getUpcomingEvents = async (): Promise<ApiResponse<TEvent[]>> => {
  const res = await fetch(`${CLIENT_URL}/event/upcoming`, defaultFetchOptions)

  if (!res.ok) {
    throw new Error(`Failed to fetch events: ${res.statusText}`)
  }

  return res.json() as Promise<ApiResponse<TEvent[]>>
}

const getEvent = async (eventId: number): Promise<ApiResponse<TFight[]>> => {
  const res = await fetch(`${CLIENT_URL}/event/${eventId}`, defaultFetchOptions)

  if (!res.ok) {
    throw new Error(`Failed to fetch event ${eventId}: ${res.statusText}`)
  }

  return res.json() as Promise<ApiResponse<TFight[]>>
}

const getPick = async (): Promise<ApiResponse<TPick[]>> => {
  const res = await fetch(`${CLIENT_URL}/picks`, defaultFetchOptions)

  if (!res.ok) {
    throw new Error(`Failed to fetch picks: ${res.statusText}`)
  }

  return res.json() as Promise<ApiResponse<TPick[]>>
}

const postPick = async (
  fighter_id: number,
  fight_id: number,
): Promise<MutationResponse> => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/picks`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      fighter_id,
      fight_id,
    }),
  })
  const updatePick = (await res.json()) as MutationResponse
  return updatePick
}

export { getUpcomingEvents, getPick, getEvent, postPick }
