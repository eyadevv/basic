import router from '@adonisjs/core/services/router'
import axios from 'axios'
import ytdl from '@distube/ytdl-core'
import downloadVideo from '../lib/donwload.js'
import split from '../lib/split.js'
import getVideoInfo from '../lib/info.js'
import fs from 'node:fs'
import { title } from 'node:process'
const sendMessage = async (senderPsid: string, videoInfo: any) => {
  // Create an array of buttons for different quality formats
  const buttons = videoInfo.formats.slice(0, 3).map((format: { qualityLabel: any }) => ({
    type: 'postback',
    title: `${format.qualityLabel}` || 'Audio Only',
    payload: 'hello WOrld',
  }))

  const requestBody = {
    recipient: {
      id: senderPsid,
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title: videoInfo.title,
              image_url: videoInfo.thumbnail, // Include the video thumbnail here
              subtitle: videoInfo.description || 'No description available',
              buttons, // Add buttons for different formats
            },
          ],
        },
      },
    },
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v15.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      requestBody
    )
    console.log('Message sent successfully')
  } catch (error) {
    console.error('Unable to send message:', error.response ? error.response.data : error.message)
  }
}
const sendText = async (senderPsid: string, text: string) => {
  // Create an array of buttons for different quality formats

  const requestBody = {
    recipient: {
      id: senderPsid,
    },
    messaging_type: 'RESPONSE',
    message: {
      text,
    },
  }

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v15.0/me/messages?access_token=${process.env.PAGE_ACCESS_TOKEN}`,
      requestBody
    )
    console.log('Message sent successfully')
  } catch (error) {
    console.error('Unable to send message:', error.response ? error.response.data : error.message)
  }
}
let downloading = false

router.post('/webhook', async ({ request, response }) => {
  const body = request.body()
  if (body.object === 'page') {
    const event = body.entry[0].messaging[0]
    const senderPsid = event.sender.id
    const msg: string = event.message.text
    if (event.message && msg && msg.startsWith('https://')) {
      console.log('Received a msg')
      // console.log(downloading)
      try {
        const cookies = fs.readFileSync('/home/eyad/Projects/basic/yt.json', 'utf-8')
        const agent = ytdl.createAgent(JSON.parse(cookies))
        const { format, videoInfo } = await getVideoInfo(msg, agent)
        await sendText(senderPsid, 'Your Video is being Downloaded')
        await downloadVideo(
          msg,
          `/home/eyad/Projects/basic/videos/${videoInfo.videoDetails.title}.${format[0].container}`,
          format[0],
          agent
        )
        await sendText(senderPsid, 'Download Video Sucessfully ' + videoInfo.videoDetails.title)
        await split(
          `/home/eyad/Projects/basic/videos/${videoInfo.videoDetails.title}.${format[0].container}`
        )
        await sendText(senderPsid, 'Done Splitting the video ,Now the hard part')
      } catch (error) {
        console.log('There was an error: ' + error)
        await sendText(senderPsid, `There was an error - error code is: ${error.code}`)
      }
    } else {
      console.log('lol')
      // await sendText(senderPsid, 'Action is Not allowed please send a url') // Send the message with video thumbnail and buttons
    }
  }

  return response.status(200).send('EVENT_RECEIVED')
})

router.get('/webhook', async ({ request, response }) => {
  const mode = request.input('hub.mode')
  const token = request.input('hub.verify_token')
  const challenge = request.input('hub.challenge')

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED')
      return response.status(200).send(challenge)
    } else {
      return response.status(403)
    }
  }
  return response.status(404)
})
