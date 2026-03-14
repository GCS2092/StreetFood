'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// --- VALIDATION ZOD ---
const loginSchema = z.object({
  email:    z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuth()
  const { isAuth } = useAuthStore()
  const router = useRouter()

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuth) router.replace('/')
  }, [isAuth, router])

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password)
    } catch {
      // L'erreur est déjà gérée dans useAuth avec un toast
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-5xl">🍢</span>
          <h1 className="font-display text-3xl font-bold mt-4 text-white">
            Bon retour !
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Connecte-toi pour commander chez tes vendeurs préférés
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-5">
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="mamadou@example.com"
              icon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={<Lock size={16} />}
              iconEnd={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          {/* Mot de passe oublié */}
          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button
            fullWidth
            size="lg"
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
          >
            Se connecter
          </Button>
        </div>

        {/* Lien inscription */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            S'inscrire
          </Link>
        </p>

      </div>
    </div>
  )
}