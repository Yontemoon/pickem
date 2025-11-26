import { createFileRoute, redirect } from "@tanstack/react-router"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/signup")({
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
  return (
    <div>
      {" "}
      <form className="space-y-2">
        <div className="flex-col">
          <Label>Email</Label>
          <Input />
          <Label>Password</Label>
          <Input />
        </div>

        <Button>Sign Up</Button>
      </form>
    </div>
  )
}
