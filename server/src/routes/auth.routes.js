const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')
const { validate } = require('../middleware/validate.middleware')
const { authenticate } = require('../middleware/auth.middleware')
const { authLimiter, otpLimiter, resetPasswordLimiter } = require('../middleware/rateLimiter.middleware')

// ─── CONNEXION CLASSIQUE ──────────────────────────────────
router.post('/register',      authLimiter, validate('register'), authController.register)
router.post('/login',         authLimiter, validate('login'),    authController.login)
router.post('/refresh',       authLimiter,                       authController.refresh)
router.post('/logout',        authenticate,                      authController.logout)

// ─── CONNEXION PAR SMS ────────────────────────────────────
router.post('/send-otp',      otpLimiter,  validate('sendOtp'),  authController.sendOtp)
router.post('/verify-otp',               validate('verifyOtp'), authController.verifyOtp)

// ─── CONNEXION SOCIALE ────────────────────────────────────
router.post('/google',        authLimiter,                       authController.googleLogin)
router.post('/facebook',      authLimiter,                       authController.facebookLogin)

// ─── RÉINITIALISATION MOT DE PASSE ───────────────────────
router.post('/forgot-password',    resetPasswordLimiter,         authController.forgotPassword)
router.post('/verify-reset-code',                                authController.verifyResetCode)
router.post('/reset-password',                                   authController.resetPassword)

module.exports = router