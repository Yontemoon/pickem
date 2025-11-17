import { createFileRoute, redirect, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    console.log("hello", context.auth)
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/signup",
        search: {
          // Save current location for redirect after login
          redirect: location.href,
        },
      })
    }
  },
  component: () => <Outlet />,
})
