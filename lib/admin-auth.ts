import { supabase } from "./supabase-client"

const ADMIN_EMAIL = "morgan@morganbarber.me"

export async function isAdmin(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return false
    }

    // Ensure admin profile exists in profiles table
    const { data: profile, error } = await supabase.from("profiles").select("id").eq("id", user.id).single()

    if (error || !profile) {
      // Create admin profile if it doesn't exist
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: "Morgan Barber",
      })
    }

    return true
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

export async function ensureAdminProfile() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user && user.email === ADMIN_EMAIL) {
      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: "Morgan Barber",
      })
    }
  } catch (error) {
    console.error("Error ensuring admin profile:", error)
  }
}
