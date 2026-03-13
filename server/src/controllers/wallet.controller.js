const prisma = require('../utils/prisma')

// ─── SOLDE DU WALLET ──────────────────────────────────────────
// GET /api/wallet/balance
const getBalance = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { walletBalance: true }
    })

    return res.status(200).json({ balance: user.walletBalance })
  } catch (err) {
    next(err)
  }
}

// ─── HISTORIQUE DES TRANSACTIONS ─────────────────────────────
// GET /api/wallet/transactions
// Supporte : ?page=1&limit=20&type=PURCHASE
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const where = { userId: req.user.id }
    if (type) where.type = type

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.walletTransaction.count({ where })
    ])

    return res.status(200).json({ transactions, total, page: parseInt(page) })
  } catch (err) {
    next(err)
  }
}

// ─── STATISTIQUES GLOBALES ────────────────────────────────────
// GET /api/wallet/stats
// Renvoie les chiffres clés pour les StatBlock de l'écran wallet
const getStats = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Période du mois en cours
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalSpent,
      monthSpent,
      lastMonthSpent,
      totalOrders,
      monthOrders,
      topVendor,
    ] = await Promise.all([

      // Total dépensé toute période
      prisma.walletTransaction.aggregate({
        where:  { userId, type: 'PURCHASE' },
        _sum:   { amount: true },
      }),

      // Dépenses ce mois-ci
      prisma.walletTransaction.aggregate({
        where:  { userId, type: 'PURCHASE', createdAt: { gte: startOfMonth } },
        _sum:   { amount: true },
      }),

      // Dépenses le mois dernier
      prisma.walletTransaction.aggregate({
        where:  { userId, type: 'PURCHASE', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum:   { amount: true },
      }),

      // Nombre total de commandes complétées
      prisma.order.count({
        where: { userId, status: 'COMPLETED' }
      }),

      // Commandes ce mois-ci
      prisma.order.count({
        where: { userId, status: 'COMPLETED', createdAt: { gte: startOfMonth } }
      }),

      // Vendeur le plus fréquenté
      prisma.order.groupBy({
        by:      ['vendorId'],
        where:   { userId, status: 'COMPLETED' },
        _count:  { vendorId: true },
        orderBy: { _count: { vendorId: 'desc' } },
        take:    1,
      }),
    ])

    // Récupérer le nom du vendeur favori
    let favoriteVendor = null
    if (topVendor.length > 0) {
      favoriteVendor = await prisma.vendor.findUnique({
        where:  { id: topVendor[0].vendorId },
        select: { id: true, name: true, coverImage: true }
      })
    }

    // Calculer l'évolution vs mois dernier en %
    const currentMonthAmount = Math.abs(monthSpent._sum.amount || 0)
    const lastMonthAmount    = Math.abs(lastMonthSpent._sum.amount || 0)
    const evolution = lastMonthAmount > 0
      ? Math.round(((currentMonthAmount - lastMonthAmount) / lastMonthAmount) * 100)
      : 0

    return res.status(200).json({
      totalSpent:     Math.abs(totalSpent._sum.amount || 0),
      monthSpent:     currentMonthAmount,
      lastMonthSpent: lastMonthAmount,
      evolution,             // % d'évolution vs mois dernier (+12 ou -8)
      totalOrders,
      monthOrders,
      favoriteVendor,
    })
  } catch (err) {
    next(err)
  }
}

// ─── HABITUDES DE DÉPENSES ────────────────────────────────────
// GET /api/wallet/habits
// Renvoie les données pour SpendingChart et HabitSummary
const getHabits = async (req, res, next) => {
  try {
    const userId = req.user.id
    const now    = new Date()

    // ── Dépenses par jour sur les 30 derniers jours ───────────
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyTransactions = await prisma.walletTransaction.findMany({
      where: {
        userId,
        type:      'PURCHASE',
        createdAt: { gte: thirtyDaysAgo }
      },
      orderBy: { createdAt: 'asc' },
    })

    // Grouper par jour
    const dailySpending = dailyTransactions.reduce((acc, tx) => {
      const day = tx.createdAt.toISOString().split('T')[0] // "2025-03-13"
      if (!acc[day]) acc[day] = 0
      acc[day] += Math.abs(tx.amount)
      return acc
    }, {})

    // ── Dépenses par catégorie de plat ───────────────────────
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status:    'COMPLETED',
          createdAt: { gte: thirtyDaysAgo }
        }
      },
      include: {
        dish:  { select: { category: true, price: true } },
        order: { select: { createdAt: true } }
      }
    })

    const byCategory = orderItems.reduce((acc, item) => {
      const cat = item.dish.category
      if (!acc[cat]) acc[cat] = 0
      acc[cat] += item.unitPrice * item.quantity
      return acc
    }, {})

    // ── Jour de la semaine le plus actif ──────────────────────
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    const byDayOfWeek = dailyTransactions.reduce((acc, tx) => {
      const dayIndex = new Date(tx.createdAt).getDay()
      const dayName  = dayNames[dayIndex]
      if (!acc[dayName]) acc[dayName] = 0
      acc[dayName] += Math.abs(tx.amount)
      return acc
    }, {})

    const busiestDay = Object.entries(byDayOfWeek)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    // ── Heure de commande la plus fréquente ───────────────────
    const completedOrders = await prisma.order.findMany({
      where:  { userId, status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true }
    })

    const byHour = completedOrders.reduce((acc, order) => {
      const hour = new Date(order.createdAt).getHours()
      if (!acc[hour]) acc[hour] = 0
      acc[hour]++
      return acc
    }, {})

    const peakHour = Object.entries(byHour)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return res.status(200).json({
      dailySpending,   // { "2025-03-01": 2500, "2025-03-02": 1800, ... }
      byCategory,      // { "PLAT": 12000, "BOISSON": 3500, ... }
      byDayOfWeek,     // { "Vendredi": 8500, "Samedi": 6200, ... }
      busiestDay,      // "Vendredi"
      peakHour,        // "12" (midi)
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getBalance,
  getTransactions,
  getStats,
  getHabits,
}