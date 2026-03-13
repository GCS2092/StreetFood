const cloudinary = require('cloudinary').v2
require('dotenv').config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Uploader une image depuis un fichier temporaire
const uploadImage = async (filePath, folder = 'streetfood-dakar') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    transformation: [{ width: 800, crop: 'limit' }, { quality: 'auto' }],
  })
  return result.secure_url
}

// Supprimer une image par son URL publique
const deleteImage = async (imageUrl) => {
  if (!imageUrl) return
  const parts = imageUrl.split('/')
  const filename = parts[parts.length - 1].split('.')[0]
  const folder = parts[parts.length - 2]
  await cloudinary.uploader.destroy(`${folder}/${filename}`)
}

module.exports = { uploadImage, deleteImage }