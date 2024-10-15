import router from '@adonisjs/core/services/router'
import axios from 'axios'
import ytdl from '@distube/ytdl-core'
import downloadVideo from '../lib/download.js'
import getVideoInfo from '../lib/format.js'
import fs from 'node:fs'
import { readdir, rm } from 'node:fs/promises'
import embed from '../lib/embed.js'
import clipper from '../lib/split.js'
import FbmSend from 'fbm-send'
const fbmSend = new FbmSend({
  accessToken:
    'EAAHR3q6ZCxw4BO5IG26vfdJ05UtttoolVru3alQDdUNdcaqJG1SVBdOm9TAOSU1uqZCDZC6HvpKi9JnjZCZBpdPZA0L6DPOZCXxmdViHnmjSOb4pWUcNKStvUqVbZB44U9jYi29Hw6FGVDx2z9DcQaJ3ZC2qD51LaluWkeUkuuJ9gb1Cys6J2NdbrJx7wqYUQlsRM',
  version: '21.0',
})
const p = import.meta.dirname.split('/')
p.pop()
const path = p.join('/')

// Retry helper for redundancy

// Upload an image to a remote server (e.g., Facebook)

function delay(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}
let isDownloading = false
// Send a text message (e.g., via Messenger)
const sendText = async (senderPsid: string, text: string) => {
  const requestBody = {
    recipient: { id: senderPsid },
    messaging_type: 'RESPONSE',
    message: { text },
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v15.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      requestBody
    )

    console.log('Message sent successfully')
  } catch (error) {
    console.error('Unable to send message:', error.response ? error.response.data : error.message)
  }
}
const sendImg = async (filePath: string) => {
  let retries = 3
  try {
    const res = await fbmSend.image(filePath, {
      to: '6839300156166221',
      messagingType: 'RESPONSE',
      isReusable: false,
    })

    return res
  } catch (error) {
    if (retries > 0) {
      console.log('Error when sending embeded file ' + retries)
      await delay(2)
      retries = retries - 1
      await sendImg(filePath)
    } else {
      throw new Error('Failed to Send Embeded Data file please debug')
    }
  }
}

router.post('/webhook', async ({ request, response }) => {
  const body = request.body()
  if (body.object !== 'page') return response.status(404)

  const event = body.entry[0].messaging[0]
  const senderPsid = event.sender.id
  const msg: string = event.message.text

  if (event.message && msg && msg.startsWith('https://')) {
    console.log(senderPsid)
    console.log('MSG')
    if (isDownloading) {
      await sendText(senderPsid, 'There is a nother download being processed')
    } else {
      // console.log(event)
      try {
        isDownloading = true

        const cookies = fs.readFileSync(`${path}/yt.json`, 'utf-8')
        const agent = ytdl.createAgent(JSON.parse(cookies))

        // Step 1: Get video info
        const { videoFormats, videoInfo } = await getVideoInfo(msg, agent)
        await delay(2)
        // Step 2: Download video
        const bestQuality = ytdl.chooseFormat(videoFormats, {
          quality: 'highest',
        })
        const videoPath = `${path}/videos/${videoInfo.videoDetails.title}.${bestQuality.container}`
        await downloadVideo(msg, videoPath, bestQuality, agent)
        await delay(2)

        // // Step 3: Split video into chunks
        console.log(bestQuality.container)
        await clipper(`${path}/videos/${videoInfo.videoDetails.title}.${bestQuality.container}`)

        // console.log('Video chunks created.')

        // // Step 4: Read chunks, process them block-by-block (optional upload example)
        const chunks = await readdir(`${path}/videos/${videoInfo.videoDetails.title}`)
        const embederFunc = async (chunk: string) => {
          let retries = 3
          try {
            const download = await embed(
              `${path}/videos/${videoInfo.videoDetails.title}/${chunk}`,
              `${path}/videos/${videoInfo.videoDetails.title}`,
              `${path}/files/cover.png`
            )
            return download
          } catch (error) {
            if (retries > 0) {
              console.log('error on embed function retries left :' + retries)
              await delay(2)
              retries = retries - 1
              await embederFunc(chunk)
            } else {
              throw new Error('Failed to Embed file please debug')
            }
          }
        }
        for (const chunk of chunks) {
          if (!chunk.includes('.crdownload') && !chunk.endsWith('.png') && chunk.includes('.')) {
            const embedPath = await embederFunc(chunk)
            embedPath ? await sendImg(embedPath) : null
          }
        }

        // Send success message
        await sendText(senderPsid, 'Your video has been processed and uploaded!')
        await delay(10)
        await rm(`${path}/videos/${videoInfo.videoDetails.title}`, {
          force: true,
          recursive: true,
        })
        await sendText(senderPsid, 'Server has Cleared Files from Disk !')
        isDownloading = false
      } catch (error) {
        console.error('Error occurred during the workflow:', error)
        await sendText(senderPsid, `An error occurred: ${error.message}`)
        isDownloading = false

        // Log error but keep the server running
      }
    }
  } else {
    await sendText(senderPsid, 'Action Not allowed please enter a valid url')
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
