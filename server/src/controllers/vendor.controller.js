const prisma = require('../utils/prisma')
const { uploadImage, deleteImage } = require('../utils/cloudinary')

// ─── HELPER : calculer la distance GPS ───────────────────────
// Formule de Haversine — calcule la distance en km entre deux points GPS
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── HELPER : vérifier que le vendeur appartient à l'user ─────
const checkVendorOwnership = async (vendorId, userId, role) => {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!vendor) return { error: 'Vendeur introuvable', status: 404 }
  if (role !== 'ADMIN' && vendor.ownerId !== userId) {
    return { error: 'Vous n\'êtes pas propriétaire de ce commerce', status: 403 }
  }
  return { vendor }
}

// ─── LISTE TOUS LES VENDEURS ──────────────────────────────────
// GET /api/vendors
// Supporte les filtres : ?category=xxx&isOpen=true&search=xxx
const getAll = async (req, res, next) => {
  try {
    const { category, isOpen, search } = req.query

    const where = {}

    if (category)       where.categoryId = category
    if (isOpen === 'true')  where.isOpen = true
    if (isOpen === 'false') where.isOpen = false
    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address:     { contains: search, mode: 'insensitive' } },
      ]
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        category:     { select: { id: true, name: true, icon: true } },
        openingHours: true,
        _count:       { select: { dishes: true } },
      },
      orderBy: { averageRating: 'desc' },
    })

    return res.status(200).json({ vendors, total: vendors.length })
  } catch (err) {
    next(err)
  }
}

// ─── VENDEURS PROCHES (GPS) ───────────────────────────────────
// GET /api/vendors/nearby?lat=14.7&lng=-17.4&radius=3
const getNearby = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Coordonnées GPS requises (lat et lng)' })
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const maxRadius = parseFloat(radius)

    // Récupérer tous les vendeurs ouverts
    const vendors = await prisma.vendor.findMany({
      where: { isOpen: true },
      include: {
        category:     { select: { id: true, name: true, icon: true } },
        openingHours: true,
      }
    })

    // Filtrer par distance et ajouter la distance calculée
    const nearby = vendors
      .map(vendor => ({
        ...vendor,
        distance: getDistance(userLat, userLng, vendor.latitude, vendor.longitude)
      }))
      .filter(v => v.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance) // Plus proche en premier

    return res.status(200).json({ vendors: nearby, total: nearby.length })
  } catch (err) {
    next(err)
  }
}

// ─── FICHE D'UN VENDEUR ───────────────────────────────────────
// GET /api/vendors/:id
const getOne = async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.params.id },
      include: {
        category:     true,
        openingHours: { orderBy: { day: 'asc' } },
        dishes: {
          where:   { isAvailable: true },
          orderBy: { category: 'asc' },
        },
        _count: { select: { reviews: true, orders: true } },
      }
    })

    if (!vendor) {
      return res.status(404).json({ error: 'Vendeur introuvable' })
    }

    return res.status(200).json({ vendor })
  } catch (err) {
    next(err)
  }
}

// ─── AVIS D'UN VENDEUR ────────────────────────────────────────
// GET /api/vendors/:id/reviews
const getReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where:   { vendorId: req.params.id },
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where: { vendorId: req.params.id } })
    ])

    return res.status(200).json({ reviews, total, page: parseInt(page) })
  } catch (err) {
    next(err)
  }
}

// ─── LISTE LES CATÉGORIES ────────────────────────────────────
// GET /api/vendors/categories
const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.vendorCategory.findMany({
      include: { _count: { select: { vendors: true } } },
      orderBy: { name: 'asc' },
    })
    return res.status(200).json({ categories })
  } catch (err) {
    next(err)
  }
}

// ─── CRÉER UN VENDEUR ─────────────────────────────────────────
// POST /api/vendors
const create = async (req, res, next) => {
  try {
    const { name, description, latitude, longitude, address, phone, categoryId } = req.body

    // Un utilisateur ne peut avoir qu'un seul commerce
    const existing = await prisma.vendor.findUnique({
      where: { ownerId: req.user.id }
    })
    if (existing) {
      return res.status(409).json({ error: 'Vous avez déjà un commerce enregistré' })
    }

    const vendor = await prisma.vendor.create({
      data: {
        name, description, latitude, longitude,
        address, phone, categoryId,
        ownerId: req.user.id,
      },
      include: { category: true }
    })

    return res.status(201).json({ vendor })
  } catch (err) {
    next(err)
  }
}

// ─── MODIFIER UN VENDEUR ──────────────────────────────────────
// PUT /api/vendors/:id
const update = async (req, res, next) => {
  try {
    const { error, status } = await checkVendorOwnership(
      req.params.id, req.user.id, req.user.role
    )
    if (error) return res.status(status).json({ error })

    const { name, description, latitude, longitude, address, phone, categoryId } = req.body

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data:  { name, description, latitude, longitude, address, phone, categoryId },
      include: { category: true, openingHours: true }
    })

    return res.status(200).json({ vendor })
  } catch (err) {
    next(err)
  }
}

// ─── CHANGER LA PHOTO DE COUVERTURE ──────────────────────────
// PATCH /api/vendors/:id/cover
const updateCover = async (req, res, next) => {
  try {
    const { error, status, vendor: existing } = await checkVendorOwnership(
      req.params.id, req.user.id, req.user.role
    )
    if (error) return res.status(status).json({ error })

    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image reçue' })
    }

    // Supprimer l'ancienne image si elle existe
    if (existing.coverImage) await deleteImage(existing.coverImage)

    // Uploader la nouvelle image sur Cloudinary
    const imageBuffer = req.file.buffer.toString('base64')
    const dataUri = `data:${req.file.mimetype};base64,${imageBuffer}`
    const coverImage = await uploadImage(dataUri, 'vendors')

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data:  { coverImage }
    })

    return res.status(200).json({ vendor })
  } catch (err) {
    next(err)
  }
}

// ─── OUVRIR / FERMER LE COMMERCE ──────────────────────────────
// PATCH /api/vendors/:id/status
const toggleStatus = async (req, res, next) => {
  try {
    const { error, status, vendor: existing } = await checkVendorOwnership(
      req.params.id, req.user.id, req.user.role
    )
    if (error) return res.status(status).json({ error })

    const vendor = await prisma.vendor.update({
      where: { id: req.params.id },
      data:  { isOpen: !existing.isOpen }
    })

    return res.status(200).json({
      vendor,
      message: vendor.isOpen ? 'Commerce ouvert' : 'Commerce fermé'
    })
  } catch (err) {
    next(err)
  }
}

// ─── METTRE À JOUR LES HORAIRES ───────────────────────────────
// PUT /api/vendors/:id/opening-hours
// Body : { hours: [{ day: "MONDAY", openTime: "08:00", closeTime: "20:00", isClosed: false }] }
const updateOpeningHours = async (req, res, next) => {
  try {
    const { error, status } = await checkVendorOwnership(
      req.params.id, req.user.id, req.user.role
    )
    if (error) return res.status(status).json({ error })

    const { hours } = req.body
    if (!Array.isArray(hours)) {
      return res.status(400).json({ error: 'Format invalide — hours doit être un tableau' })
    }

    // Supprimer les anciens horaires et recréer
    await prisma.openingHours.deleteMany({ where: { vendorId: req.params.id } })

    const openingHours = await prisma.openingHours.createMany({
      data: hours.map(h => ({
        vendorId:  req.params.id,
        day:       h.day,
        openTime:  h.openTime,
        closeTime: h.closeTime,
        isClosed:  h.isClosed || false,
      }))
    })

    return res.status(200).json({ message: 'Horaires mis à jour', count: openingHours.count })
  } catch (err) {
    next(err)
  }
}

// ─── AJOUTER / RETIRER DES FAVORIS ───────────────────────────
// POST /api/vendors/:id/favorite
const toggleFavorite = async (req, res, next) => {
  try {
    const vendorId = req.params.id
    const userId   = req.user.id

    // Vérifier que le vendeur existe
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor) return res.status(404).json({ error: 'Vendeur introuvable' })

    // Vérifier si déjà en favori
    const existing = await prisma.favoriteVendor.findUnique({
      where: { userId_vendorId: { userId, vendorId } }
    })

    if (existing) {
      // Retirer des favoris
      await prisma.favoriteVendor.delete({
        where: { userId_vendorId: { userId, vendorId } }
      })
      return res.status(200).json({ isFavorite: false, message: 'Retiré des favoris' })
    } else {
      // Ajouter aux favoris
      await prisma.favoriteVendor.create({ data: { userId, vendorId } })
      return res.status(200).json({ isFavorite: true, message: 'Ajouté aux favoris' })
    }
  } catch (err) {
    next(err)
  }
}

// ─── MES FAVORIS ─────────────────────────────────────────────
// GET /api/vendors/me/favorites
const getFavorites = async (req, res, next) => {
  try {
    const favorites = await prisma.favoriteVendor.findMany({
      where:   { userId: req.user.id },
      include: {
        vendor: {
          include: {
            category:     { select: { id: true, name: true, icon: true } },
            openingHours: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    const vendors = favorites.map(f => f.vendor)
    return res.status(200).json({ vendors, total: vendors.length })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAll,
  getNearby,
  getOne,
  getReviews,
  getCategories,
  create,
  update,
  updateCover,
  toggleStatus,
  updateOpeningHours,
  toggleFavorite,
  getFavorites,
}