import React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { FormEvent } from "react"
import { CLIENT_URL } from "@/lib/constants"

export const Route = createFileRoute("/signin")({
  component: RouteComponent,
})

function RouteComponent() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    console.log(email)
    console.log(password)

    const res = await fetch(`${CLIENT_URL}/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: password,
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
    const data = await res.json()
    console.log(data)
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
