const { z } = require('zod')

const schemas = {

  // Inscription
  register: z.object({
    name: z
      .string()
      .min(2, 'Le nom doit faire au moins 2 caractères')
      .max(100, 'Le nom ne peut pas dépasser 100 caractères')
      .regex(
        /^[\p{L}\s\-''.]+$/u,
        'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'
      )
      .transform(val => val.trim()),
    phone:    z.string().optional(),
    email:    z.string().email('Email invalide').optional(),
    password: z.string().min(6, 'Le mot de passe doit faire au moins 6 caractères').optional(),
  }).refine(data => data.phone || data.email, {
    message: 'Un numéro de téléphone ou un email est requis',
  }),

  // Connexion classique
  login: z.object({
    phone:    z.string().optional(),
    email:    z.string().email().optional(),
    password: z.string().min(1, 'Mot de passe requis'),
  }),

  // Envoi du code OTP
  sendOtp: z.object({
    phone: z.string().min(8, 'Numéro de téléphone invalide'),
  }),

  // Vérification du code OTP
  verifyOtp: z.object({
    phone: z.string().min(8),
    code:  z.string().length(6, 'Le code doit faire 6 chiffres'),
  }),

  // Créer ou modifier un vendeur
  vendor: z.object({
    name: z
      .string()
      .min(2, 'Le nom doit faire au moins 2 caractères')
      .max(100, 'Le nom ne peut pas dépasser 100 caractères')
      .regex(
        /^[\p{L}\s\-''.]+$/u,
        'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'
      )
      .transform(val => val.trim()),
    description: z.string().optional(),
    latitude:    z.number(),
    longitude:   z.number(),
    address:     z.string().optional(),
    phone:       z.string().optional(),
    categoryId:  z.string().optional(),
  }),

  // Créer ou modifier un plat
  dish: z.object({
    name:        z.string().min(2),
    description: z.string().optional(),
    price:       z.number().positive('Le prix doit être positif'),
    prepTime:    z.number().optional(),
    category:    z.enum(['ENTREE', 'PLAT', 'DESSERT', 'BOISSON', 'SNACK']).optional(),
    isAvailable: z.boolean().optional(),
  }),

  // Passer une commande
  order: z.object({
    vendorId:      z.string(),
    paymentMethod: z.enum(['CASH', 'WAVE', 'ORANGE_MONEY']),
    note:          z.string().optional(),
    items: z.array(z.object({
      dishId:   z.string(),
      quantity: z.number().int().positive(),
    })).min(1, 'La commande doit contenir au moins un plat'),
  }),

  // Laisser un avis
  review: z.object({
    vendorId: z.string(),
    rating:   z.number().int().min(1).max(5),
    comment:  z.string().optional(),
  }),

}

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName]
    if (!schema) return next()

    const result = schema.safeParse(req.body)

    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }))
      return res.status(400).json({ error: 'Données invalides', details: errors })
    }

    req.body = result.data
    next()
  }
}

module.exports = { validate }