const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')

// ─── TOUTES LES ROUTES NÉCESSITENT D'ÊTRE CONNECTÉ ───────────
router.use(authenticate)

// ─── ROUTES CLIENT ────────────────────────────────────────────
router.post('/',                    validate('order'), orderController.create)
router.get('/my-orders',                               orderController.getMyOrders)
router.get('/:id',                                     orderController.getOne)
router.patch('/:id/cancel',                            orderController.cancel)

// ─── ROUTES VENDEUR ───────────────────────────────────────────
router.get('/vendor/incoming',
  requireRole('VENDOR', 'ADMIN'),
  orderController.getVendorOrders
)

router.patch('/:id/status',
  requireRole('VENDOR', 'ADMIN'),
  orderController.updateStatus
)

module.exports = router