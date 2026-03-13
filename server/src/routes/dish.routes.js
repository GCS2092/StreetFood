const express = require('express')
const router = express.Router()
const dishController = require('../controllers/dish.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { uploadSingle } = require('../middleware/upload.middleware')

// ─── ROUTES PUBLIQUES ─────────────────────────────────────────
router.get('/vendor/:vendorId',       dishController.getByVendor)   // Tous les plats d'un vendeur
router.get('/vendor/:vendorId/:id',   dishController.getOne)        // Un plat précis

// ─── ROUTES VENDEUR ───────────────────────────────────────────
router.post('/',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  validate('dish'),
  dishController.create
)

router.put('/:id',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  validate('dish'),
  dishController.update
)

router.patch('/:id/image',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  uploadSingle,
  dishController.updateImage
)

router.patch('/:id/availability',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  dishController.toggleAvailability
)

router.delete('/:id',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  dishController.remove
)

module.exports = router