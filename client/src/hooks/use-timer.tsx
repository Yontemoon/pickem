import { formatCountdown, useTimerStore } from "@/store/use-timer-store"

export const useTimer = (eventStringDate: string) => {
  const now = useTimerStore((s) => s.now)

  const fightDeadline = eventStringDate ? new Date(eventStringDate) : new Date()

  const fightTimeNumber = fightDeadline.getTime()
  const msLeft = fightTimeNumber - now

  const isLocked = msLeft <= 0

  const timeLeft = msLeft > 0 ? formatCountdown(msLeft) : "Event started"

  return { isLocked, timeLeft }
}
