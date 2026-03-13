const bcrypt = require('bcryptjs')
const prisma = require('../utils/prisma')
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, getRefreshTokenExpiry } = require('../utils/jwt')
const { sendOtp, verifyOtp: verifyTwilioOtp } = require('../utils/otp')
const { verifyGoogleToken, verifyFacebookToken } = require('../utils/oauth')

// ─── HELPER : construire la réponse de connexion ──────────
// Utilisé par toutes les fonctions de connexion — évite la répétition
const buildAuthResponse = async (user) => {
  const accessToken  = generateAccessToken(user.id, user.role)
  const refreshToken = generateRefreshToken(user.id)

  // Sauvegarder le refresh token en base
  await prisma.refreshToken.create({
    data: {
      token:     refreshToken,
      userId:    user.id,
      expiresAt: getRefreshTokenExpiry(),
    }
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id:     user.id,
      name:   user.name,
      role:   user.role,
      avatar: user.avatar,
      phone:  user.phone,
      email:  user.email,
    }
  }
}

// ─── INSCRIPTION ──────────────────────────────────────────
// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body

    // Vérifier que l'email ou le téléphone n'est pas déjà utilisé
    const existing = await prisma.user.findFirst({
      where: { OR: [
        email ? { email } : undefined,
        phone ? { phone } : undefined,
      ].filter(Boolean) }
    })

    if (existing) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet email ou ce numéro.' })
    }

    // Chiffrer le mot de passe
    const passwordHash = password ? await bcrypt.hash(password, 12) : null

    const user = await prisma.user.create({
      data: { name, email, phone, passwordHash, role: 'CLIENT' }
    })

    const response = await buildAuthResponse(user)
    return res.status(201).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── CONNEXION CLASSIQUE ──────────────────────────────────
// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, phone, password } = req.body

    // Trouver l'utilisateur par email ou téléphone
    const user = await prisma.user.findFirst({
      where: { OR: [
        email ? { email } : undefined,
        phone ? { phone } : undefined,
      ].filter(Boolean) }
    })

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Identifiants incorrects.' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé. Contactez le support.' })
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants incorrects.' })
    }

    const response = await buildAuthResponse(user)
    return res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── RENOUVELER LE TOKEN ──────────────────────────────────
// POST /api/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token manquant.' })
    }

    // Vérifier le token cryptographiquement
    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré.' })
    }

    // Vérifier que le token existe en base et n'est pas révoqué
    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, role: true, isActive: true } } }
    })

    if (!stored || stored.revokedAt || !stored.user.isActive) {
      return res.status(401).json({ error: 'Session expirée. Reconnectez-vous.' })
    }

    if (new Date() > stored.expiresAt) {
      return res.status(401).json({ error: 'Session expirée. Reconnectez-vous.' })
    }

    // Générer un nouvel access token
    const newAccessToken = generateAccessToken(stored.user.id, stored.user.role)
    return res.status(200).json({ accessToken: newAccessToken })
  } catch (err) {
    next(err)
  }
}

// ─── DÉCONNEXION ──────────────────────────────────────────
// POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      // Révoquer le refresh token en base
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.user.id, revokedAt: null },
        data:  { revokedAt: new Date() }
      })
    }

    return res.status(200).json({ message: 'Déconnecté avec succès.' })
  } catch (err) {
    next(err)
  }
}

// ─── ENVOYER LE CODE SMS ──────────────────────────────────
// POST /api/auth/send-otp
const sendOtpHandler = async (req, res, next) => {
  try {
    const { phone } = req.body

    // Sauvegarder la demande en base pour la traçabilité
    await prisma.otpCode.create({
      data: {
        phone,
        code:      'TWILIO_MANAGED', // Twilio gère le code — on trace juste la demande
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      }
    })

    await sendOtp(phone)
    return res.status(200).json({ message: 'Code SMS envoyé.' })
  } catch (err) {
    next(err)
  }
}

// ─── VÉRIFIER LE CODE SMS ─────────────────────────────────
// POST /api/auth/verify-otp
const verifyOtpHandler = async (req, res, next) => {
  try {
    const { phone, code } = req.body

    // Vérifier le code via Twilio
    const isValid = await verifyTwilioOtp(phone, code)
    if (!isValid) {
      return res.status(401).json({ error: 'Code incorrect ou expiré.' })
    }

    // Trouver ou créer l'utilisateur
    let user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      // Première connexion — créer le compte automatiquement
      user = await prisma.user.create({
        data: { phone, name: 'Utilisateur', role: 'CLIENT' }
      })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé.' })
    }

    const response = await buildAuthResponse(user)
    return res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── CONNEXION GOOGLE ─────────────────────────────────────
// POST /api/auth/google
const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ error: 'Token Google manquant.' })
    }

    const googleData = await verifyGoogleToken(idToken)

    // Chercher un compte existant par googleId ou par email
    let user = await prisma.user.findFirst({
      where: { OR: [
        { googleId: googleData.googleId },
        googleData.email ? { email: googleData.email } : undefined,
      ].filter(Boolean) }
    })

    if (user) {
      // Mettre à jour le googleId si connexion par email existant
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data:  { googleId: googleData.googleId }
        })
      }
    } else {
      // Créer le compte
      user = await prisma.user.create({
        data: {
          name:     googleData.name,
          email:    googleData.email,
          avatar:   googleData.avatar,
          googleId: googleData.googleId,
          role:     'CLIENT',
        }
      })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé.' })
    }

    const response = await buildAuthResponse(user)
    return res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── CONNEXION FACEBOOK ───────────────────────────────────
// POST /api/auth/facebook
const facebookLogin = async (req, res, next) => {
  try {
    const { accessToken } = req.body
    if (!accessToken) {
      return res.status(400).json({ error: 'Token Facebook manquant.' })
    }

    const fbData = await verifyFacebookToken(accessToken)

    let user = await prisma.user.findFirst({
      where: { OR: [
        { facebookId: fbData.facebookId },
        fbData.email ? { email: fbData.email } : undefined,
      ].filter(Boolean) }
    })

    if (user) {
      if (!user.facebookId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data:  { facebookId: fbData.facebookId }
        })
      }
    } else {
      user = await prisma.user.create({
        data: {
          name:       fbData.name,
          email:      fbData.email,
          avatar:     fbData.avatar,
          facebookId: fbData.facebookId,
          role:       'CLIENT',
        }
      })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé.' })
    }

    const response = await buildAuthResponse(user)
    return res.status(200).json(response)
  } catch (err) {
    next(err)
  }
}

// ─── MOT DE PASSE OUBLIÉ ──────────────────────────────────
// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { phone, email } = req.body

    const user = await prisma.user.findFirst({
      where: { OR: [
        phone ? { phone } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) }
    })

    // Réponse identique que le compte existe ou non — sécurité
    if (!user) {
      return res.status(200).json({ message: 'Si ce compte existe, un code a été envoyé.' })
    }

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Invalider les anciens codes de reset pour cet utilisateur
    await prisma.otpCode.updateMany({
      where: { userId: user.id, isUsed: false },
      data:  { isUsed: true }
    })

    // Sauvegarder le nouveau code
    await prisma.otpCode.create({
      data: { phone: phone || '', code, expiresAt, userId: user.id }
    })

    // Envoyer par SMS si numéro disponible
    if (phone || user.phone) {
      await sendOtp(phone || user.phone)
    }

    return res.status(200).json({ message: 'Si ce compte existe, un code a été envoyé.' })
  } catch (err) {
    next(err)
  }
}

// ─── VÉRIFIER LE CODE DE RESET ────────────────────────────
// POST /api/auth/verify-reset-code
const verifyResetCode = async (req, res, next) => {
  try {
    const { phone, email, code } = req.body

    const user = await prisma.user.findFirst({
      where: { OR: [
        phone ? { phone } : undefined,
        email ? { email } : undefined,
      ].filter(Boolean) }
    })

    if (!user) {
      return res.status(401).json({ error: 'Code invalide ou expiré.' })
    }

    // Chercher un code valide non utilisé et non expiré
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId:    user.id,
        code,
        isUsed:    false,
        expiresAt: { gt: new Date() }
      }
    })

    if (!otpRecord) {
      return res.status(401).json({ error: 'Code invalide ou expiré.' })
    }

    // Marquer le code comme utilisé
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data:  { isUsed: true }
    })

    // Générer un token temporaire de reset (valide 15 minutes)
    const resetToken = generateAccessToken(user.id, 'RESET')
    return res.status(200).json({ resetToken })
  } catch (err) {
    next(err)
  }
}

// ─── CHANGER LE MOT DE PASSE ──────────────────────────────
// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Token ou mot de passe invalide.' })
    }

    // Vérifier le token temporaire
    const { verifyAccessToken } = require('../utils/jwt')
    const decoded = verifyAccessToken(resetToken)

    if (!decoded || decoded.role !== 'RESET') {
      return res.status(401).json({ error: 'Token de réinitialisation invalide ou expiré.' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: decoded.userId },
      data:  { passwordHash }
    })

    // Révoquer toutes les sessions existantes — sécurité
    await prisma.refreshToken.updateMany({
      where: { userId: decoded.userId, revokedAt: null },
      data:  { revokedAt: new Date() }
    })

    return res.status(200).json({ message: 'Mot de passe mis à jour. Reconnectez-vous.' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  sendOtp:          sendOtpHandler,
  verifyOtp:        verifyOtpHandler,
  googleLogin,
  facebookLogin,
  forgotPassword,
  verifyResetCode,
  resetPassword,
}