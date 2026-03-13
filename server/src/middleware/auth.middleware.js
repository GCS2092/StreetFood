const { verifyAccessToken } = require('../utils/jwt')
const prisma = require('../utils/prisma')

const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token dans l'en-tête Authorization: Bearer <token>
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return res.status(401).json({ error: 'Token expiré ou invalide' })
    }

    // Vérifier que l'utilisateur existe toujours en base
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, isActive: true, name: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé' })
    }

    // Ajouter l'utilisateur à la requête — accessible dans tous les controllers
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Authentification échouée' })
  }
}

module.exports = { authenticate }