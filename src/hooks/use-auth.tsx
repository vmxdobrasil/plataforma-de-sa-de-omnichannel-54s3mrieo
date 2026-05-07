import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  signUp: (
    email: string,
    password: string,
    name: string,
    role: string,
    crmNumber?: string,
    crmState?: string,
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })
    setLoading(false)
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'medical_director') {
      const keysToClear = [
        'lastVisitedPath',
        'last_visited_route',
        'navigation_state',
        'redirect_url',
        'returnTo',
      ]
      keysToClear.forEach((key) => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
    }
  }, [user?.role])

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: string,
    crmNumber?: string,
    crmState?: string,
  ) => {
    try {
      const data: any = {
        email,
        password,
        passwordConfirm: password,
        name,
        role,
      }
      if (role === 'professional') {
        data.crm_number = crmNumber
        data.crm_state = crmState
      }

      await pb.collection('users').create(data)
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      if (authData.record.is_blocked) {
        pb.authStore.clear()
        return {
          error: {
            message:
              'Sua conta está bloqueada por irregularidades. Entre em contato com a administração.',
          },
        }
      }
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    const keysToClear = [
      'lastVisitedPath',
      'last_visited_route',
      'navigation_state',
      'redirect_url',
      'returnTo',
    ]
    keysToClear.forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
