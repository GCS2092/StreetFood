'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'

export function useAuth() {
  const router   = useRouter()
  const store    = useAuthStore()

  // --- LOGIN ---
  const login = async (email: string, password: string) => {
    try {
      await store.login(email, password)
      toast.success('Connexion réussie')
      router.push('/')
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Identifiants incorrects'
      toast.error(message)
      throw error
    }
  }

  // --- REGISTER ---
  const register = async (data: {
    name:      string
    email?:    string
    phone?:    string
    password:  string
  }) => {
    try {
      await store.register(data)
      toast.success('Compte créé avec succès !')
      router.push('/')
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Erreur lors de la création du compte'
      toast.error(message)
      throw error
    }
  }

  // --- LOGOUT ---
  const logout = async () => {
    try {
      await store.logout()
      toast.success('Déconnecté')
      router.push('/auth/login')
    } catch {
      // Même en cas d'erreur, on déconnecte localement
      router.push('/auth/login')
    }
  }

  return {
    login,
    register,
    logout,
    user:      store.user,
    isAuth:    store.isAuth,
    isLoading: store.isLoading,
  }
}