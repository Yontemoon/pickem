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

export type { TFight }
