import { cache } from 'react'
import { supabaseServer } from '@/lib/supabase/server'

export const getAdminContext = cache(async () => {
  const db = await supabaseServer()
  if (!db) return { db: null, user: null, isAdmin: false }

  const { data: { user } } = await db.auth.getUser()
  if (!user) return { db, user: null, isAdmin: false }

  const { data: role, error } = await db
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(`Could not verify administrator access: ${error.message}`)

  return { db, user, isAdmin: Boolean(role) }
})
