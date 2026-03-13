const express = require('express')
const router = express.Router()
const vendorController = require('../controllers/vendor.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { requireRole } = require('../middleware/role.middleware')
const { validate } = require('../middleware/validate.middleware')
const { uploadSingle } = require('../middleware/upload.middleware')

// ─── ROUTES PUBLIQUES (pas besoin d'être connecté) ───────────
router.get('/',              vendorController.getAll)        // Liste tous les vendeurs
router.get('/categories',    vendorController.getCategories) // Liste les catégories
router.get('/nearby',        vendorController.getNearby)     // Vendeurs proches (GPS)
router.get('/:id',           vendorController.getOne)        // Fiche d'un vendeur
router.get('/:id/reviews',   vendorController.getReviews)    // Avis d'un vendeur

// ─── ROUTES PRIVÉES CLIENT ────────────────────────────────────
router.post('/:id/favorite', authenticate, vendorController.toggleFavorite) // Ajouter/retirer des favoris
router.get('/me/favorites',  authenticate, vendorController.getFavorites)   // Mes vendeurs favoris

// ─── ROUTES VENDEUR (rôle VENDOR requis) ─────────────────────
router.post('/',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  validate('vendor'),
  vendorController.create
)

router.put('/:id',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  validate('vendor'),
  vendorController.update
)

router.patch('/:id/cover',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  uploadSingle,
  vendorController.updateCover
)

router.patch('/:id/status',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  vendorController.toggleStatus
)

router.put('/:id/opening-hours',
  authenticate,
  requireRole('VENDOR', 'ADMIN'),
  vendorController.updateOpeningHours
)

module.exports = router