import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

const isFutureTime = (time: string) => {
  console.log(time)

  const currentDate = new Date()
  const timeDate = new Date(time)
  console.log(currentDate, timeDate)
  if (currentDate < timeDate) {
    return true
  }
  return false
}

export { cn, isFutureTime }
