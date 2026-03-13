const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/review.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')

// ─── ROUTES PUBLIQUES ─────────────────────────────────────────
router.get('/vendor/:vendorId', reviewController.getByVendor)

// ─── ROUTES CLIENT ────────────────────────────────────────────
router.post('/',
  authenticate,
  validate('review'),
  reviewController.create
)

router.delete('/:id',
  authenticate,
  reviewController.remove
)

// ─── ROUTES VENDEUR ───────────────────────────────────────────
router.patch('/:id/reply',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  reviewController.reply
)

module.exports = router