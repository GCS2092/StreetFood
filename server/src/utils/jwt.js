const jwt = require('jsonwebtoken')

const ACCESS_SECRET = process.env.JWT_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_EXPIRES = '15m'
const REFRESH_EXPIRES = '30d'

// Créer un access token (15 minutes)
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES })
}

// Créer un refresh token (30 jours)
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES })
}

// Vérifier un access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, ACCESS_SECRET)
  } catch {
    return null
  }
}

// Vérifier un refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, REFRESH_SECRET)
  } catch {
    return null
  }
}

// Calculer la date d'expiration du refresh token
const getRefreshTokenExpiry = () => {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
}