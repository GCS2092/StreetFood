const { OAuth2Client } = require('google-auth-library')

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

// Vérifier un token Google et récupérer les infos du compte
const verifyGoogleToken = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  return {
    googleId: payload.sub,
    email:    payload.email,
    name:     payload.name,
    avatar:   payload.picture,
  }
}

// Facebook — vérifier un access token via l'API Graph
const verifyFacebookToken = async (accessToken) => {
  const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Token Facebook invalide')
  const data = await response.json()
  return {
    facebookId: data.id,
    email:      data.email || null,
    name:       data.name,
    avatar:     data.picture?.data?.url || null,
  }
}

module.exports = { verifyGoogleToken, verifyFacebookToken }