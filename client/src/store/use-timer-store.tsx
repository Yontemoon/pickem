import { create } from "zustand"

export const formatCountdown = (ms: number) => {
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

type TimerStore = {
  now: number
  setNow: () => void
}

const useTimerStore = create<TimerStore>((set) => ({
  now: Date.now(),
  setNow: () => set({ now: Date.now() }),
}))

// Start global ticking interval once (never per component)
setInterval(() => {
  useTimerStore.getState().setNow()
}, 1000)

export { useTimerStore }
