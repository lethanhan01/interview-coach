export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="border-border bg-card text-card-foreground w-full max-w-md rounded-2xl border p-8 shadow-lg">
        {children}
      </div>
    </div>
  )
}
