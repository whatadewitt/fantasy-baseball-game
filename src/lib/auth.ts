import { cookies } from 'next/headers'
import { createServiceClient } from './supabase'

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  if (!userId) return null

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return data
}

export function generateToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36)
}
