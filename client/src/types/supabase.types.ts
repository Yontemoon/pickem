type TFight = {
  id: number
  created_at: string
  weight: number
  bout_number: number
  fight_info: {
    id: number
    corner: "red" | "blue"
    fighter: {
      name: string
    }
  }[]
}

type TPick = {
  id: number
  fight_id: number
  fighter_id: number
  user_id: string
  created_at: string
}

type TEvent = {
  id: number
  created_at: string
  event_title: string
  date: string
}
export type { TFight, TPick, TEvent }
