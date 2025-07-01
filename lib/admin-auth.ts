import { supabase } from "./supabase-client"

const ADMIN_EMAIL = "morgan@morganbarber.me"

export async function isAdmin(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.email === ADMIN_EMAIL
  } catch {
    return false
  }
}

export async function requireAdmin() {
  const admin = await isAdmin()
  if (!admin) {
    throw new Error("Admin access required")
  }
  return true
}
