import { Link } from "@tanstack/react-router"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/providers/auth"

export default function Header() {
  const { isAuthenticated } = useAuth()

  return (
    <>
      <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg justify-between">
        <div className="flex items-center">
          <h1 className="ml-4 text-xl font-semibold">
            <Link to={isAuthenticated ? "/app" : "/"}>
              <div>Pick'Em</div>
            </Link>
          </h1>
        </div>
        <ThemeToggle />
      </header>
    </>
  )
}
