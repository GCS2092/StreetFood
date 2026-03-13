const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const hpp = require('hpp')
const { xss } = require('express-xss-sanitizer')
require('dotenv').config()

const app = express()

// --- SECURITE ---------------------------------------------------
app.use(helmet())
app.use(xss())
app.use(hpp())

// --- LIMITE DE TAILLE DES REQUETES ------------------------------
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// --- CORS -------------------------------------------------------
app.use(cors({
  origin:         '*',
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// --- LOGS -------------------------------------------------------
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// --- RATE LIMITING GENERAL --------------------------------------
const { generalLimiter } = require('./middleware/rateLimiter.middleware')
app.use('/api', generalLimiter)

// --- ROUTES -----------------------------------------------------
app.use('/api/auth',    require('./routes/auth.routes'))
app.use('/api/vendors', require('./routes/vendor.routes'))
app.use('/api/dishes',  require('./routes/dish.routes'))
app.use('/api/orders',  require('./routes/order.routes'))
app.use('/api/reviews', require('./routes/review.routes'))
app.use('/api/wallet',  require('./routes/wallet.routes'))

// --- ROUTE DE SANTE ---------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status:      'OK',
    message:     'StreetFood Dakar API en ligne',
    environment: process.env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  })
})

// --- ROUTE INCONNUE ---------------------------------------------
app.all('{*path}', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} introuvable` })
})

// --- GESTIONNAIRE D'ERREURS GLOBAL ------------------------------
app.use(require('./middleware/error.middleware'))

// --- DEMARRAGE --------------------------------------------------
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Serveur demarre sur http://localhost:${PORT}`)
  console.log(`Environnement : ${process.env.NODE_ENV}`)
  console.log(`Routes disponibles :`)
  console.log(`   POST   /api/auth/register`)
  console.log(`   POST   /api/auth/login`)
  console.log(`   GET    /api/vendors`)
  console.log(`   GET    /api/vendors/nearby`)
  console.log(`   GET    /api/dishes/vendor/:vendorId`)
  console.log(`   POST   /api/orders`)
  console.log(`   GET    /api/reviews/vendor/:vendorId`)
  console.log(`   GET    /api/wallet/stats`)
})