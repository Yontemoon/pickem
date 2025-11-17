import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/app")({
  beforeLoad: ({ context, location }) => {
    console.log(context.auth)
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/signin",
        search: {
          // Save current location for redirect after login
          redirect: location.href,
        },
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app"!</div>
}
