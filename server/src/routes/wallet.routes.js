const express = require('express')
const router = express.Router()
const walletController = require('../controllers/wallet.controller')
const { authenticate } = require('../middleware/auth.middleware')

// Toutes les routes wallet nécessitent d'être connecté
router.use(authenticate)

router.get('/balance',       walletController.getBalance)
router.get('/transactions',  walletController.getTransactions)
router.get('/stats',         walletController.getStats)
router.get('/habits',        walletController.getHabits)

module.exports = router