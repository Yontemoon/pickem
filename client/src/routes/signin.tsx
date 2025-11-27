import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ZSignIn } from "@/lib/zod"
import { useForm } from "@tanstack/react-form"
import type { AnyFieldApi } from "@tanstack/react-form"

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

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? (
        <em>{field.state.meta.errors.map((err) => err.message).join(",")}</em>
      ) : null}
      {field.state.meta.isValidating ? "Validating..." : null}
    </>
  )
}

function RouteComponent() {
  const { auth } = Route.useRouteContext()
  const navigate = useNavigate()
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: ZSignIn,
    },
    onSubmit: async ({ value }) => {
      console.log(value)
      const res = await auth.login(value.email, value.password)
      navigate({
        to: "/app",
      })
    },
  })

  return (
    <div className="flex items-center justify-center">
      <div className="flex justify-center container max-w-md w-full ">
        <form
          className="space-y-2 w-full"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <div className="">
            <form.Field
              name="email"
              children={(field) => {
                // Avoid hasty abstractions. Render props are great!
                return (
                  <div className="mb-4">
                    <Label htmlFor={field.name}>First Name:</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    <FieldInfo field={field} />
                  </div>
                )
              }}
            />
            <form.Field
              name="password"
              children={(field) => (
                <div className="">
                  <Label htmlFor={field.name}>Password:</Label>
                  <Input
                    type="password"
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field} />
                </div>
              )}
            />
          </div>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {isSubmitting ? "..." : "Submit"}
              </Button>
            )}
          />
        </form>
      </div>
    </div>
  )
}
