import { DEMO_USERS, DEMO_PASSWORD } from './store'
import { MockQueryBuilder } from './query-builder'

// ─── Browser (client-side) mock ───────────────────────────────────────────────

export function createMockBrowserClient() {
  return {
    auth: {
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        const user = DEMO_USERS.find((u) => u.email === email)
        if (!user || password !== DEMO_PASSWORD) {
          return { error: new Error('E-mail ou senha incorretos') }
        }
        // Set demo session cookie via API
        await fetch('/api/demo-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        return { error: null }
      },

      signOut: async () => {
        await fetch('/api/demo-auth', { method: 'DELETE' })
        return { error: null }
      },

      updateUser: async ({ password }: { password?: string }) => {
        // No-op in demo mode
        return { error: null }
      },

      getUser: async () => {
        // Client-side: check cookie via API
        try {
          const res = await fetch('/api/demo-auth')
          const { userId } = await res.json()
          if (!userId) return { data: { user: null } }
          return { data: { user: { id: userId } } }
        } catch {
          return { data: { user: null } }
        }
      },
    },

    from: (table: string) => new MockQueryBuilder(table),

    storage: {
      from: () => ({
        upload: async (path: string, file: File) => {
          // Store as base64 data URL for demo
          return new Promise<{ data: unknown; error: null }>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              // Store file URL as data URL
              ;(globalThis as any).__demoFiles = (globalThis as any).__demoFiles || {}
              ;(globalThis as any).__demoFiles[path] = reader.result
              resolve({ data: { path }, error: null })
            }
            reader.readAsDataURL(file)
          })
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `/api/demo-file?path=${encodeURIComponent(path)}` },
        }),
        remove: async () => ({ error: null }),
      }),
    },
  }
}

// ─── Server-side mock ─────────────────────────────────────────────────────────

export function createMockServerClient(cookieHeader?: string) {
  const userId = extractDemoSession(cookieHeader)

  return {
    auth: {
      getUser: async () => {
        if (!userId) return { data: { user: null } }
        return { data: { user: { id: userId } } }
      },
    },
    from: (table: string) => new MockQueryBuilder(table),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `#${path}` } }),
        remove: async () => ({ error: null }),
      }),
    },
  }
}

function extractDemoSession(cookieHeader?: string): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/demo_session=([^;]+)/)
  return match ? match[1] : null
}
