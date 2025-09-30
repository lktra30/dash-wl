import { LoginForm } from "@/components/login-form"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Whitelabel CRM</h1>
          <p className="text-muted-foreground">Multi-tenant CRM solution with custom branding</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
