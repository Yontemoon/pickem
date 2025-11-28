import { createFileRoute, Outlet } from "@tanstack/react-router"
import Header from "@/components/Header"

export const Route = createFileRoute("/_auth")({
  component: RouteComponent,
})

function RouteComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <div>
      <Header queryClient={queryClient} />
      <Outlet />
    </div>
  )
}
