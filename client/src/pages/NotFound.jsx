import { Link } from "react-router-dom"

function NotFound() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-6xl font-bold">
        404
      </h1>

      <p className="mt-4 text-muted-foreground">
        Page not found.
      </p>

      <Link
        to="/"
        className="mt-6 underline"
      >
        Return home
      </Link>
    </section>
  )
}

export default NotFound