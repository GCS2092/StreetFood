'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/auth.store'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

// --- VALIDATION ZOD ---
// Correspond exactement à ce que le backend attend
const registerSchema = z.object({
  name:     z.string().min(2, 'Minimum 2 caractères'),
  email:    z.string().email('Email invalide').optional().or(z.literal('')),
  phone:    z.string().min(9, 'Numéro invalide').optional().or(z.literal('')),
  password: z.string().min(6, 'Minimum 6 caractères'),
  confirm:  z.string(),
}).refine(data => data.password === data.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
}).refine(data => data.email || data.phone, {
  message: 'Email ou téléphone requis',
  path: ['email'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuth()
  const { isAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuth) router.replace('/')
  }, [isAuth, router])

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        name:     data.name,
        email:    data.email || undefined,
        phone:    data.phone || undefined,
        password: data.password,
      })
    } catch {
      // Géré dans useAuth
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-5xl">🍢</span>
          <h1 className="font-display text-3xl font-bold mt-4 text-white">
            Créer un compte
          </h1>
          <p className="text-neutral-400 mt-2 text-sm">
            Rejoins des milliers de gourmands à Dakar
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">

          <Input
            label="Nom complet"
            type="text"
            placeholder="Mamadou Diallo"
            icon={<User size={16} />}
            error={errors.name?.message}
            {...register('name')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="mamadou@example.com"
            icon={<Mail size={16} />}
            error={errors.email?.message}
            hint="Email ou téléphone requis"
            {...register('email')}
          />

          <Input
            label="Téléphone"
            type="tel"
            placeholder="+221771234567"
            icon={<Phone size={16} />}
            error={errors.phone?.message}
            {...register('phone')}
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

          <Input
            label="Confirmer le mot de passe"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            icon={<Lock size={16} />}
            error={errors.confirm?.message}
            {...register('confirm')}
          />

          <Button
            fullWidth
            size="lg"
            loading={isLoading}
            onClick={handleSubmit(onSubmit)}
            className="mt-2"
          >
            Créer mon compte
          </Button>
        </div>

        {/* Lien connexion */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  )
}