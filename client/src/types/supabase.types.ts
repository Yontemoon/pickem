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

type TPicks = {
  id: number
  fight_id: number
  fighter_id: number
  user_id: string
  created_at: string
}

export type { TFight, TPicks }
