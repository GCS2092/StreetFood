const twilio = require('twilio')

// Initialisation du client Twilio
const getClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) throw new Error('Twilio non configuré')
  return twilio(accountSid, authToken)
}

// Envoyer un code OTP par SMS
const sendOtp = async (phoneNumber) => {
  const client = getClient()
  await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SID)
    .verifications.create({
      to: phoneNumber,  // format international ex: +221771234567
      channel: 'sms',
    })
  return true
}

// Vérifier le code saisi par l'utilisateur
const verifyOtp = async (phoneNumber, code) => {
  const client = getClient()
  const result = await client.verify.v2
    .services(process.env.TWILIO_VERIFY_SID)
    .verificationChecks.create({
      to: phoneNumber,
      code,
    })
  return result.status === 'approved'
}

module.exports = { sendOtp, verifyOtp }