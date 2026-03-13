const multer = require('multer')
const path = require('path')

// Stockage temporaire en mémoire (pas sur le disque)
const storage = multer.memoryStorage()

// Filtre — accepter uniquement les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Format non supporté — utilisez JPG, PNG ou WebP'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
})

// Middleware pour une seule image (photo de profil, cover vendeur)
const uploadSingle = upload.single('image')

// Middleware pour plusieurs images (galerie de plats)
const uploadMultiple = upload.array('images', 5)

// Wrapper pour gérer les erreurs multer proprement
const handleUpload = (uploadFn) => (req, res, next) => {
  uploadFn(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image trop lourde — 5 MB maximum' })
      }
      return res.status(400).json({ error: err.message })
    }
    if (err) {
      return res.status(400).json({ error: err.message })
    }
    next()
  })
}

module.exports = {
  uploadSingle:   handleUpload(uploadSingle),
  uploadMultiple: handleUpload(uploadMultiple),
}