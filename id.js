import axios from 'axios'
const token =
  'EAAHR3q6ZCxw4BO5IG26vfdJ05UtttoolVru3alQDdUNdcaqJG1SVBdOm9TAOSU1uqZCDZC6HvpKi9JnjZCZBpdPZA0L6DPOZCXxmdViHnmjSOb4pWUcNKStvUqVbZB44U9jYi29Hw6FGVDx2z9DcQaJ3ZC2qD51LaluWkeUkuuJ9gb1Cys6J2NdbrJx7wqYUQlsRM'

const sendText = async () => {
  const requestBody = {
    recipient: { id: '6839300156166221' },
    messaging_type: 'RESPONSE',
    message: 'This is a msg',
  }

  try {
    const msg = await axios.post(
      `https://graph.facebook.com/v15.0/me/messages?access_token=${token}`,
      requestBody
    )
    console.log(msg)
    console.log('Message sent successfully')
  } catch (error) {
    console.error('Unable to send message:', error.response ? error.response.data : error.message)
  }
}

await sendText()
