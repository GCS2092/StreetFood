const prisma = require('../utils/prisma')

// ─── AVIS D'UN VENDEUR ────────────────────────────────────────
// GET /api/reviews/vendor/:vendorId
// Supporte : ?page=1&limit=10&rating=5
const getByVendor = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, rating } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = { vendorId: req.params.vendorId }
    if (rating) where.rating = parseInt(rating)

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.review.count({ where })
    ])

    // Calculer la distribution des notes (1★ à 5★)
    const distribution = await prisma.review.groupBy({
      by:     ['rating'],
      where:  { vendorId: req.params.vendorId },
      _count: { rating: true },
    })

    return res.status(200).json({
      reviews,
      total,
      page: parseInt(page),
      distribution,
    })
  } catch (err) {
    next(err)
  }
}

// ─── LAISSER UN AVIS ──────────────────────────────────────────
// POST /api/reviews
const create = async (req, res, next) => {
  try {
    const { vendorId, rating, comment } = req.body
    const userId = req.user.id

    // Vérifier que le vendeur existe
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })
    if (!vendor) {
      return res.status(404).json({ error: 'Vendeur introuvable' })
    }

    // Vérifier que le client a déjà commandé chez ce vendeur
    const hasOrdered = await prisma.order.findFirst({
      where: {
        userId,
        vendorId,
        status: 'COMPLETED'
      }
    })
    if (!hasOrdered) {
      return res.status(403).json({
        error: 'Vous devez avoir effectué une commande chez ce vendeur pour laisser un avis'
      })
    }

    // Vérifier qu'il n'a pas déjà laissé un avis
    const existing = await prisma.review.findUnique({
      where: { userId_vendorId: { userId, vendorId } }
    })
    if (existing) {
      return res.status(409).json({
        error: 'Vous avez déjà laissé un avis pour ce vendeur'
      })
    }

    // Créer l'avis et recalculer la moyenne en transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data:    { userId, vendorId, rating, comment },
        include: { user: { select: { id: true, name: true, avatar: true } } }
      })

      // Recalculer la moyenne et le total des avis du vendeur
      const stats = await tx.review.aggregate({
        where:   { vendorId },
        _avg:    { rating: true },
        _count:  { rating: true },
      })

      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          averageRating: Math.round((stats._avg.rating || 0) * 10) / 10,
          totalReviews:  stats._count.rating,
        }
      })

      return newReview
    })

    // Notifier le vendeur du nouvel avis
    await prisma.notification.create({
      data: {
        userId:  vendor.ownerId,
        type:    'NEW_REVIEW',
        title:   'Nouvel avis client',
        body:    `${req.user.name} vous a laissé un avis ${rating} étoile(s)`,
        orderId: null,
      }
    })

    return res.status(201).json({ review })
  } catch (err) {
    next(err)
  }
}

// ─── RÉPONDRE À UN AVIS (VENDEUR) ────────────────────────────
// PATCH /api/reviews/:id/reply
// Body : { reply: "Merci pour votre retour !" }
const reply = async (req, res, next) => {
  try {
    const { reply } = req.body

    if (!reply || reply.trim().length < 2) {
      return res.status(400).json({ error: 'La réponse est trop courte' })
    }

    // Récupérer l'avis avec le vendeur
    const existing = await prisma.review.findUnique({
      where:   { id: req.params.id },
      include: { vendor: { select: { ownerId: true } } }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Avis introuvable' })
    }

    // Vérifier que c'est bien le vendeur concerné
    if (existing.vendor.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Vous ne pouvez répondre qu\'à vos propres avis' })
    }

    if (existing.vendorReply) {
      return res.status(409).json({ error: 'Vous avez déjà répondu à cet avis' })
    }

    const review = await prisma.review.update({
      where: { id: req.params.id },
      data:  { vendorReply: reply.trim(), repliedAt: new Date() },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    })

    return res.status(200).json({ review })
  } catch (err) {
    next(err)
  }
}

// ─── SUPPRIMER UN AVIS ────────────────────────────────────────
// DELETE /api/reviews/:id
const remove = async (req, res, next) => {
  try {
    const existing = await prisma.review.findUnique({
      where: { id: req.params.id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Avis introuvable' })
    }

    // Seul l'auteur ou un admin peut supprimer
    if (existing.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: req.params.id } })

      // Recalculer la moyenne après suppression
      const stats = await tx.review.aggregate({
        where:  { vendorId: existing.vendorId },
        _avg:   { rating: true },
        _count: { rating: true },
      })

      await tx.vendor.update({
        where: { id: existing.vendorId },
        data: {
          averageRating: Math.round((stats._avg.rating || 0) * 10) / 10,
          totalReviews:  stats._count.rating,
        }
      })
    })

    return res.status(200).json({ message: 'Avis supprimé' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getByVendor,
  create,
  reply,
  remove,
}