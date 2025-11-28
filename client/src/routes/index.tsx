// import React from "react"
import { Button } from "@/components/ui/button"
import { createFileRoute, Link, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: App,
  beforeLoad({ context }) {
    const isAuth = context.auth.isAuthenticated

    if (isAuth) {
      throw redirect({
        to: "/app",
      })
    }
  },
})

function App() {
  return (
    <div className="text-center mx-10 px-2 h-screen flex flex-col mt-20 gap-5">
      <h1>Pick'em Home Page</h1>

      {/*  Section will be used as a demo for picking the main fight in main card */}
      {/* Figure out how to have single user pick, cannot be localstorage based. */}
      {/* <section>

      </section> */}

      {/*  */}
      {/* <section>
      </section> */}

      <div className="space-x-2">
        <Link to="/signin">
          <Button>Sign In</Button>
        </Link>
        <Link to="/signup">
          <Button>Sign Up</Button>
        </Link>
      </div>
    </div>
  )
}
