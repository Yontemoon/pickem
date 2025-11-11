import { createFileRoute } from "@tanstack/react-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export const Route = createFileRoute("/signin")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex justify-center container">
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
