const rateLimit = require('express-rate-limit')

// Limiteur gÃ©nÃ©ral â€” 100 requÃªtes par 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Trop de requÃªtes, rÃ©essayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Limiteur connexion â€” 5 tentatives par 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Trop de tentatives de connexion.',
    detail: 'Compte temporairement bloquÃ©, rÃ©essayez dans 15 minutes.',
    // L'app mobile affiche ce champ pour guider l'utilisateur
    action: 'wait_or_reset_password',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Limiteur OTP â€” 3 SMS par heure
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Trop de codes SMS demandÃ©s, rÃ©essayez dans 1 heure.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Limiteur rÃ©initialisation mot de passe
// â€” 3 demandes par heure (Ã©vite le spam d'emails/SMS de reset)
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error: 'Trop de demandes de rÃ©initialisation.',
    detail: 'RÃ©essayez dans 1 heure.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  generalLimiter,
  authLimiter,
  otpLimiter,
  resetPasswordLimiter,
}