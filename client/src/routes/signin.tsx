import React from "react"
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { FormEvent } from "react"

export const Route = createFileRoute("/signin")({
  component: RouteComponent,
  beforeLoad({ context }) {
    const isAuth = context.auth.isAuthenticated

    if (isAuth) {
      throw redirect({
        to: "/app",
      })
    }
  },
})

function RouteComponent() {
  const { auth } = Route.useRouteContext()
  const navigate = useNavigate()

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await auth.login(email, password)
    navigate({ to: "/app" })
  }

  return (
    <div>
      <div className="flex justify-center container max-w-md w-full ">
        <form className="space-y-2 w-full" onSubmit={handleSubmit}>
          <div className="flex-col">
            <Label>Email</Label>
            <Input onChange={(e) => setEmail(e.target.value)} />
            <Label>Password</Label>
            <Input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </div>

          <Button type="submit">Sign Up</Button>
        </form>
      </div>
    </div>
  )
}
