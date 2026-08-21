function Hero({ title, description }) {
  return (
    <section className="px-6 py-16 text-center">
      <h1 className="text-4xl font-bold">
        {title}
      </h1>

      <p className="mt-4 text-muted-foreground">
        {description}
      </p>
    </section>
  )
}

export default Hero