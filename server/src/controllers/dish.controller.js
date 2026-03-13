const prisma = require('../utils/prisma')
const { uploadImage, deleteImage } = require('../utils/cloudinary')

// ─── HELPER : vérifier que le plat appartient au vendeur ──────
const checkDishOwnership = async (dishId, userId, role) => {
  const dish = await prisma.dish.findUnique({
    where:   { id: dishId },
    include: { vendor: { select: { ownerId: true } } }
  })

  if (!dish) return { error: 'Plat introuvable', status: 404 }

  if (role !== 'ADMIN' && dish.vendor.ownerId !== userId) {
    return { error: 'Ce plat n\'appartient pas à votre commerce', status: 403 }
  }

  return { dish }
}

// ─── TOUS LES PLATS D'UN VENDEUR ─────────────────────────────
// GET /api/dishes/vendor/:vendorId
// Supporte : ?category=PLAT&available=true
const getByVendor = async (req, res, next) => {
  try {
    const { category, available } = req.query

    const where = { vendorId: req.params.vendorId }

    if (category)              where.category    = category
    if (available === 'true')  where.isAvailable = true
    if (available === 'false') where.isAvailable = false

    const dishes = await prisma.dish.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    })

    // Grouper les plats par catégorie pour l'affichage en sections
    const grouped = dishes.reduce((acc, dish) => {
      if (!acc[dish.category]) acc[dish.category] = []
      acc[dish.category].push(dish)
      return acc
    }, {})

    return res.status(200).json({ dishes, grouped, total: dishes.length })
  } catch (err) {
    next(err)
  }
}

// ─── UN PLAT PRÉCIS ───────────────────────────────────────────
// GET /api/dishes/vendor/:vendorId/:id
const getOne = async (req, res, next) => {
  try {
    const dish = await prisma.dish.findFirst({
      where: { id: req.params.id, vendorId: req.params.vendorId }
    })

    if (!dish) return res.status(404).json({ error: 'Plat introuvable' })

    return res.status(200).json({ dish })
  } catch (err) {
    next(err)
  }
}

// ─── CRÉER UN PLAT ────────────────────────────────────────────
// POST /api/dishes
const create = async (req, res, next) => {
  try {
    // Récupérer le vendeur de l'utilisateur connecté
    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: req.user.id }
    })

    if (!vendor) {
      return res.status(404).json({
        error: 'Vous n\'avez pas de commerce enregistré'
      })
    }

    const { name, description, price, prepTime, category, isAvailable } = req.body

    const dish = await prisma.dish.create({
      data: {
        name,
        description,
        price,
        prepTime,
        category:    category    || 'PLAT',
        isAvailable: isAvailable ?? true,
        vendorId:    vendor.id,
      }
    })

    return res.status(201).json({ dish })
  } catch (err) {
    next(err)
  }
}

// ─── MODIFIER UN PLAT ─────────────────────────────────────────
// PUT /api/dishes/:id
const update = async (req, res, next) => {
  try {
    const { error, status } = await checkDishOwnership(
      req.params.id, req.user.id, req.user.role
    )
    if (error) return res.status(status).json({ error })

    const { name, description, price, prepTime, category, isAvailable } = req.body

    const dish = await prisma.dish.update({
      where: { id: req.params.id },
      data:  { name, description, price, prepTime, category, isAvailable }
    })

    return res.status(200).json({ dish })
  } catch (err) {
    next(err)
  }
}

// ─── CHANGER LA PHOTO D'UN PLAT ───────────────────────────────
// PATCH /api/dishes/:id/image
const updateImage = async (req, res, next) => {
  try {
    const { error, status, dish: existing } = await checkDishOwnership(
      req.params.id, req.user.id, req.user.role
    )
    if (error) return res.status(status).json({ error })

    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image reçue' })
    }

    // Supprimer l'ancienne image si elle existe
    if (existing.image) await deleteImage(existing.image)

    // Uploader la nouvelle sur Cloudinary
    const imageBuffer = req.file.buffer.toString('base64')
    const dataUri = `data:${req.file.mimetype};base64,${imageBuffer}`
    const image = await uploadImage(dataUri, 'dishes')

    const dish = await prisma.dish.update({
      where: { id: req.params.id },
      data:  { image }
    })

    return res.status(200).json({ dish })
  } catch (err) {
    next(err)
  }
}

// ─── RENDRE DISPONIBLE / INDISPONIBLE ─────────────────────────
// PATCH /api/dishes/:id/availability
const toggleAvailability = async (req, res, next) => {
  try {
    const { error, status, dish: existing } = await checkDishOwnership(
      req.params.id, req.user.id, req.user.role
    )
    if (error) return res.status(status).json({ error })

    const dish = await prisma.dish.update({
      where: { id: req.params.id },
      data:  { isAvailable: !existing.isAvailable }
    })

    return res.status(200).json({
      dish,
      message: dish.isAvailable ? 'Plat disponible' : 'Plat indisponible'
    })
  } catch (err) {
    next(err)
  }
}

// ─── SUPPRIMER UN PLAT ────────────────────────────────────────
// DELETE /api/dishes/:id
const remove = async (req, res, next) => {
  try {
    const { error, status, dish: existing } = await checkDishOwnership(
      req.params.id, req.user.id, req.user.role
    )
    if (error) return res.status(status).json({ error })

    // Supprimer l'image Cloudinary si elle existe
    if (existing.image) await deleteImage(existing.image)

    await prisma.dish.delete({ where: { id: req.params.id } })

    return res.status(200).json({ message: 'Plat supprimé' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getByVendor,
  getOne,
  create,
  update,
  updateImage,
  toggleAvailability,
  remove,
}