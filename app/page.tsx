export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center gap-6 py-24">
      <h1 className="text-4xl font-bold">Welcome to Uz</h1>
      <p className="text-muted-foreground">Find your perfect match. Connect with someone special.</p>
      <div className="flex gap-3">
        <a className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90" href="/login">Login</a>
        <a className="px-4 py-2 rounded-md border hover:bg-accent" href="/register">Create account</a>
      </div>
    </main>
  )
}
