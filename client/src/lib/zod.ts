import * as z from "zod"

const ZSignIn = z.object({
  email: z.email(),
  password: z.string(),
})

export { ZSignIn }
