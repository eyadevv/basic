import router from '@adonisjs/core/services/router'
import axios from 'axios'
import ytdl, { videoInfo } from '@distube/ytdl-core'
import downloadVideo from '../lib/download.js'
import getVideoInfo from '../lib/format.js'
import fs from 'node:fs'
import { readdir, rm } from 'node:fs/promises'
import embed from '../lib/embed.js'
import clipper from '../lib/split.js'
import FbmSend from 'fbm-send'
// import { HttpProxyAgent } from 'http-proxy-agent'
import { url } from 'node:inspector'

const fbmSend = new FbmSend({
  accessToken: process.env.PAGE_ACCESS_TOKEN,
  version: '21.0',
})
const proxy = `http://xfmjghad-rotate:4uqv7mruwa73@p.webshare.io:80`
// const pagent = new HttpProxyAgent(proxy)
const p = import.meta.dirname.split('/')
p.pop()
const path = p.join('/')

function delay(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}
const senderPsid = '6839300156166221'

let isDownloading = false

const sendText = async (text: string) => {
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
    console.error(
      'Unable to send message:',
      error.response ? error.response.data : error.message,
      error.code
    )
  }
}

const sendImg = async (filePath: string) => {
  let retries = 3
  while (retries > 0) {
    try {
      const res = await fbmSend.image(filePath, {
        to: '6839300156166221',
        messagingType: 'RESPONSE',
        isReusable: false,
      })
      return res
    } catch (error) {
      retries -= 1
      console.log(`Error when sending embedded file, retries left: ${retries}`)
      await delay(2)

      if (retries === 0) {
        throw new Error('Failed to Send Embedded Data file, please debug')
      }
    }
  }
}

router.post('/webhook', async ({ request, response }) => {
  const body = request.body()
  if (body.object !== 'page') return response.status(404)

  const event = body.entry[0].messaging[0]
  // const senderPsid = event.sender.id
  const msg: string = event.message.text

  if (event.message && msg && msg.startsWith('https://')) {
    if (isDownloading) {
      await sendText('Another download is being processed. Please wait.')
    } else {
      try {
        isDownloading = true

        const cookies = fs.readFileSync(`${path}/yt.json`, 'utf-8')
        const agent = ytdl.createAgent(JSON.parse(cookies))

        // Step 1: Get video info
        const { videoFormats, info } = await getVideoInfo(msg, agent)
        await delay(2)

        // Step 2: Download video
        const bestQuality = ytdl.chooseFormat(videoFormats, { quality: 'highest' })
        const videoPath = `${path}/videos/${info.videoDetails.title}.${bestQuality.container}`
        await downloadVideo(msg, videoPath, bestQuality, agent, sendText)
        await delay(2)

        // Step 3: Split video into chunks
        await clipper(`${path}/videos/${info.videoDetails.title}.${bestQuality.container}`)

        // Step 4: Read chunks, process them block-by-block
        const chunks = await readdir(`${path}/videos/${info.videoDetails.title}`)

        for (const chunk of chunks) {
          if (!chunk.includes('.crdownload') && !chunk.endsWith('.png') && chunk.includes('.')) {
            try {
              // Step 5: Embed each chunk and send
              const embedPath = await embederFunc(chunk, info)
              if (embedPath) {
                await sendImg(embedPath)
                await sendText(embedPath)
              }
            } catch (embedError) {
              console.error('Embedding or sending failed:', embedError)
              await sendText(`Failed to embed or send: ${embedError.message}`)
              break // Stop further processing on error
            }
          }
        }

        // Step 6: Send success message
        await sendText('Your video has been processed and uploaded!')
        await delay(10)

        // Step 7: Clear files from disk
        // await rm(`${path}/videos/${videoInfo.videoDetails.title}`, { force: true, recursive: true })
        await sendText('Server has cleared files from disk!')
      } catch (error) {
        isDownloading = false
        console.error('Error occurred during the workflow:', error)
        await sendText(`An error occurred: ${error.message}`)
      } finally {
        isDownloading = false
      }
    }
  } else {
    await sendText('Action not allowed. Please enter a valid URL.')
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

// Embeder function with retries
const embederFunc = async (chunk: string, info: videoInfo): Promise<string | null> => {
  let retries = 3
  while (retries > 0) {
    try {
      const embedPath = await embed(
        `${path}/videos/${info.videoDetails.title}/${chunk}`,
        `${path}/videos/${info.videoDetails.title}`,
        `${path}/files/cover.png`
      )
      return embedPath // Return the path once successful
    } catch (error) {
      retries -= 1
      console.log(`Error on embed function, retries left: ${retries}`)
      await delay(2)

      if (retries === 0) {
        throw new Error('Failed to embed file, please debug.')
      }
    }
  }

  return null // Return null if all retries fail
}
