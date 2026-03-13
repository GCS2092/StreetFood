const prisma = require('../utils/prisma')

// ─── HELPER : créer une notification ─────────────────────────
// Utilisé à chaque changement de statut d'une commande
const createNotification = async (userId, type, title, body, orderId = null) => {
  await prisma.notification.create({
    data: { userId, type, title, body, orderId }
  })
}

// ─── HELPER : générer un code de retrait à 4 chiffres ─────────
const generatePickupCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// ─── PASSER UNE COMMANDE ──────────────────────────────────────
// POST /api/orders
const create = async (req, res, next) => {
  try {
    const { vendorId, items, paymentMethod, note } = req.body
    const userId = req.user.id

    // 1. Vérifier que le vendeur existe et est ouvert
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })
    if (!vendor) {
      return res.status(404).json({ error: 'Vendeur introuvable' })
    }
    if (!vendor.isOpen) {
      return res.status(400).json({ error: 'Ce commerce est actuellement fermé' })
    }

    // 2. Récupérer les plats et vérifier leur disponibilité
    const dishIds = items.map(i => i.dishId)
    const dishes = await prisma.dish.findMany({
      where: { id: { in: dishIds }, vendorId, isAvailable: true }
    })

    if (dishes.length !== dishIds.length) {
      return res.status(400).json({
        error: 'Un ou plusieurs plats sont indisponibles ou n\'appartiennent pas à ce vendeur'
      })
    }

    // 3. Calculer le total avec les prix actuels (snapshot)
    const dishMap = Object.fromEntries(dishes.map(d => [d.id, d]))
    let total = 0
    const orderItems = items.map(item => {
      const dish = dishMap[item.dishId]
      const unitPrice = dish.price
      total += unitPrice * item.quantity
      return { dishId: item.dishId, quantity: item.quantity, unitPrice }
    })

    // 4. Calculer le temps estimé (somme des prepTime * quantités)
    const estimatedTime = items.reduce((acc, item) => {
      const dish = dishMap[item.dishId]
      return acc + (dish.prepTime || 10) * item.quantity
    }, 0)

    // 5. Créer la commande avec ses lignes en une seule transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          vendorId,
          total,
          paymentMethod,
          note,
          estimatedTime,
          pickupCode:  generatePickupCode(),
          items: { create: orderItems }
        },
        include: {
          items:  { include: { dish: true } },
          vendor: { select: { id: true, name: true, phone: true } },
        }
      })

      // 6. Créer une WalletTransaction si paiement Wave/Orange Money
      if (paymentMethod !== 'CASH') {
        await tx.walletTransaction.create({
          data: {
            userId,
            type:        'PURCHASE',
            amount:      -total, // Négatif = dépense
            description: `Commande chez ${vendor.name}`,
            orderId:     newOrder.id,
          }
        })

        // Mettre à jour le solde wallet
        await tx.user.update({
          where: { id: userId },
          data:  { walletBalance: { decrement: total } }
        })
      }

      return newOrder
    })

    // 7. Notifier le vendeur d'une nouvelle commande
    await createNotification(
      vendor.ownerId,
      'ORDER_CONFIRMED',
      'Nouvelle commande !',
      `Vous avez reçu une commande de ${order.items.length} plat(s) — total : ${total} FCFA`,
      order.id
    )

    return res.status(201).json({ order })
  } catch (err) {
    next(err)
  }
}

// ─── MES COMMANDES (CLIENT) ───────────────────────────────────
// GET /api/orders/my-orders
// Supporte : ?status=PENDING&page=1&limit=10
const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = { userId: req.user.id }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, coverImage: true } },
          items:  { include: { dish: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where })
    ])

    return res.status(200).json({ orders, total, page: parseInt(page) })
  } catch (err) {
    next(err)
  }
}

// ─── DÉTAIL D'UNE COMMANDE ────────────────────────────────────
// GET /api/orders/:id
const getOne = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: { select: { id: true, name: true, coverImage: true, phone: true, latitude: true, longitude: true } },
        items:  { include: { dish: true } },
        user:   { select: { id: true, name: true, phone: true } },
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Commande introuvable' })
    }

    // Vérifier que la commande appartient au client ou au vendeur
    const isOwner   = order.userId === req.user.id
    const isVendor  = order.vendor.ownerId === req.user.id
    const isAdmin   = req.user.role === 'ADMIN'

    if (!isOwner && !isVendor && !isAdmin) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    return res.status(200).json({ order })
  } catch (err) {
    next(err)
  }
}

// ─── COMMANDES REÇUES (VENDEUR) ───────────────────────────────
// GET /api/orders/vendor/incoming
// Supporte : ?status=PENDING&page=1&limit=20
const getVendorOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // Trouver le vendeur de l'utilisateur connecté
    const vendor = await prisma.vendor.findUnique({
      where: { ownerId: req.user.id }
    })

    if (!vendor) {
      return res.status(404).json({ error: 'Vous n\'avez pas de commerce enregistré' })
    }

    const where = { vendorId: vendor.id }
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:  { select: { id: true, name: true, phone: true } },
          items: { include: { dish: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where })
    ])

    return res.status(200).json({ orders, total, page: parseInt(page) })
  } catch (err) {
    next(err)
  }
}

// ─── CHANGER LE STATUT D'UNE COMMANDE (VENDEUR) ──────────────
// PATCH /api/orders/:id/status
// Body : { status: "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" }
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body

    const validStatuses = ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' })
    }

    // Récupérer la commande avec le vendeur
    const existing = await prisma.order.findUnique({
      where:   { id: req.params.id },
      include: { vendor: true, user: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Commande introuvable' })
    }

    // Vérifier que le vendeur est bien le propriétaire
    if (existing.vendor.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    // Vérifier l'ordre logique des statuts
    const statusOrder = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']
    const currentIndex = statusOrder.indexOf(existing.status)
    const newIndex     = statusOrder.indexOf(status)

    if (newIndex <= currentIndex) {
      return res.status(400).json({
        error: `Impossible de passer de ${existing.status} à ${status}`
      })
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data:  { status },
      include: { items: { include: { dish: true } }, vendor: true }
    })

    // Notifier le client selon le nouveau statut
    const notifications = {
      CONFIRMED: {
        type:  'ORDER_CONFIRMED',
        title: 'Commande confirmée !',
        body:  `${existing.vendor.name} a confirmé votre commande. Préparation en cours...`
      },
      READY: {
        type:  'ORDER_READY',
        title: 'Commande prête !',
        body:  `Votre commande est prête ! Code de retrait : ${existing.pickupCode}`
      },
      COMPLETED: {
        type:  'ORDER_CONFIRMED',
        title: 'Commande récupérée',
        body:  `Merci ! Vous pouvez laisser un avis sur ${existing.vendor.name}.`
      },
    }

    if (notifications[status]) {
      const notif = notifications[status]
      await createNotification(
        existing.userId,
        notif.type,
        notif.title,
        notif.body,
        existing.id
      )
    }

    return res.status(200).json({ order })
  } catch (err) {
    next(err)
  }
}

// ─── ANNULER UNE COMMANDE (CLIENT) ────────────────────────────
// PATCH /api/orders/:id/cancel
const cancel = async (req, res, next) => {
  try {
    const existing = await prisma.order.findUnique({
      where:   { id: req.params.id },
      include: { vendor: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Commande introuvable' })
    }

    if (existing.userId !== req.user.id) {
      return res.status(403).json({ error: 'Accès refusé' })
    }

    // On ne peut annuler que si la commande est encore en attente
    if (!['PENDING', 'CONFIRMED'].includes(existing.status)) {
      return res.status(400).json({
        error: 'Impossible d\'annuler — la préparation a déjà commencé'
      })
    }

    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: req.params.id },
        data:  { status: 'CANCELLED' }
      })

      // Rembourser le wallet si paiement électronique
      if (existing.paymentMethod !== 'CASH') {
        await tx.walletTransaction.create({
          data: {
            userId:      existing.userId,
            type:        'REFUND',
            amount:      existing.total, // Positif = remboursement
            description: `Remboursement commande annulée — ${existing.vendor.name}`,
            orderId:     existing.id,
          }
        })

        await tx.user.update({
          where: { id: existing.userId },
          data:  { walletBalance: { increment: existing.total } }
        })
      }

      return updated
    })

    // Notifier le vendeur de l'annulation
    await createNotification(
      existing.vendor.ownerId,
      'ORDER_CANCELLED',
      'Commande annulée',
      `Un client a annulé sa commande (${existing.total} FCFA)`,
      existing.id
    )

    return res.status(200).json({ order, message: 'Commande annulée' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  create,
  getMyOrders,
  getOne,
  getVendorOrders,
  updateStatus,
  cancel,
}