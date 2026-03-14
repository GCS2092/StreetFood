'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import type { User } from '@/types'

interface AuthState {
  user:         User | null
  accessToken:  string | null
  refreshToken: string | null
  isLoading:    boolean
  isAuth:       boolean

  login:    (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout:   () => Promise<void>
  setUser:  (user: User) => void
}

interface RegisterData {
  name:      string
  email?:    string
  phone?:    string
  password:  string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,
      isAuth:       false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/api/auth/login', { email, password })
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuth: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (registerData) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/api/auth/register', registerData)
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuth: true, isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get()
          if (refreshToken) await api.post('/api/auth/logout', { refreshToken })
        } finally {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          set({ user: null, accessToken: null, refreshToken: null, isAuth: false })
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'streetdakar-auth',
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        isAuth:       state.isAuth,
      }),
    }
  )
)