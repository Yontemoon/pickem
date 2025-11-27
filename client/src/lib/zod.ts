import * as z from "zod"

const ZSearchParamAppSchema = z.object({
  event: z.number().optional(),
})

const ZSignIn = z.object({
  email: z.email(),
  password: z.string(),
})

export { ZSignIn, ZSearchParamAppSchema }
