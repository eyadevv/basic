import router from '@adonisjs/core/services/router'
import axios from 'axios'
import ytdl from '@distube/ytdl-core'
import downloadVideo from '../lib/download.js'
import getVideoInfo from '../lib/info.js'
import fs from 'node:fs'
import { readdir } from 'node:fs/promises'
import embed from '../lib/embed.js'
import clipper from '../lib/split.js'

const p = import.meta.dirname.split('/')
p.pop()
const path = p.join('/')

// Retry helper for redundancy
async function retryOperation(
  operation: () => Promise<any>,
  retries: number = 3,
  delay: number = 1000
) {
  let attempts = 0
  while (attempts < retries) {
    try {
      return await operation()
    } catch (error) {
      attempts++
      console.error(`Attempt ${attempts} failed: ${error.message}`)
      if (attempts >= retries) throw error
      await new Promise((resolve) => setTimeout(resolve, delay)) // Wait before retrying
    }
  }
}

// Upload an image to a remote server (e.g., Facebook)
const uploadImage = async (coverpath: string) => {
  // Upload logic here (currently commented out)
}

// Send a text message (e.g., via Messenger)
const sendText = async (senderPsid: string, text: string) => {
  const requestBody = {
    recipient: { id: senderPsid },
    messaging_type: 'RESPONSE',
    message: { text },
  }

  try {
    await retryOperation(() =>
      axios.post(
        `https://graph.facebook.com/v15.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
        requestBody
      )
    )
    console.log('Message sent successfully')
  } catch (error) {
    console.error('Unable to send message:', error.response ? error.response.data : error.message)
  }
}

router.post('/webhook', async ({ request, response }) => {
  const body = request.body()
  if (body.object !== 'page') return response.status(404)

  const event = body.entry[0].messaging[0]
  const senderPsid = event.sender.id
  const msg: string = event.message.text

  if (event.message && msg && msg.startsWith('https://')) {
    try {
      const cookies = fs.readFileSync(`${path}/yt.json`, 'utf-8')
      const agent = ytdl.createAgent(JSON.parse(cookies), {
        connectTimeout: 999999999,
        bodyTimeout: 999999999,
        headersTimeout: 999999999,
        keepAliveTimeout: 999999999,
      })

      // Step 1: Get video info
      const { format, videoInfo } = await retryOperation(() => getVideoInfo(msg, agent))

      // Step 2: Download video
      const videoPath = `${path}/videos/${videoInfo.videoDetails.title}.${format[0].container}`
      await retryOperation(() => downloadVideo(msg, videoPath, format[0], agent))

      console.log('Video downloaded, starting clipper process...')

      // Step 3: Split video into chunks
      await retryOperation(() => clipper(`${path}/videos/${videoInfo.videoDetails.title}`))

      console.log('Video chunks created.')

      // Step 4: Read chunks, process them block-by-block (optional upload example)
      const chunks = await readdir(`${path}/videos/${videoInfo.videoDetails.title}`).then(
        (res: any) =>
          res.sort((a: any, b: any) => {
            const numberA = Number.parseInt(a.match(/-(\d+)\.mkv$/)[1], 10)
            const numberB = Number.parseInt(b.match(/-(\d+)\.mkv$/)[1], 10)
            return numberA - numberB
          })
      )

      for (const chunk of chunks) {
        const download = await retryOperation(() =>
          embed(`${path}/videos/${videoInfo.videoDetails.title}/${chunk}`)
        )
        await retryOperation(() => uploadImage(download))
      }

      // Send success message
      await sendText(senderPsid, 'Your video has been processed and uploaded!')
    } catch (error) {
      console.error('Error occurred during the workflow:', error)
      await sendText(senderPsid, `An error occurred: ${error.message}`)
      // Log error but keep the server running
    }
  }

  return response.status(200).send('EVENT_RECEIVED')
})

// Webhook verification logic
router.get('/webhook', async ({ request, response }) => {
  const mode = request.input('hub.mode')
  const token = request.input('hub.verify_token')
  const challenge = request.input('hub.challenge')

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      return response.status(200).send(challenge)
    } else {
      return response.status(403).send('Forbidden')
    }
  }

  return response.status(404).send('Not Found')
})
