import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { ROLES, type UserRol } from '@/lib/validations/usuarios'

function isKnownRole(value: string | null | undefined): value is UserRol {
  return ROLES.includes(value as UserRol)
}

export async function resolveCurrentRole(
  supabase: SupabaseClient<Database>,
  user: User | null | undefined,
  fallbackRole?: string | null
): Promise<UserRol | null> {
  if (!user) return null

  if (isKnownRole(fallbackRole)) {
    return fallbackRole
  }

  const { data, error } = await supabase.rpc('get_my_rol')
  if (error) {
    return null
  }

  return isKnownRole(data) ? data : null
}
