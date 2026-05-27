import { isDemoMode } from '@/lib/demo/store'
import { createMockBrowserClient } from '@/lib/demo/mock-supabase'

export function createClient() {
  if (isDemoMode()) {
    return createMockBrowserClient() as ReturnType<typeof import('@supabase/ssr').createBrowserClient>
  }

  const { createBrowserClient } = require('@supabase/ssr')
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
