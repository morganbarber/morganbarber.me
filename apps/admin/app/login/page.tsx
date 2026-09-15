import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LoginForm from "@/components/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold tracking-tight">morganbarber.me</h1>
          <p className="text-muted-foreground mt-1">Content admin</p>
        </div>

        <LoginForm />

        <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
          This dashboard holds the Supabase service-role key and only accepts
          requests from localhost. It is not deployed.
        </p>
      </div>
    </main>
  );
}
