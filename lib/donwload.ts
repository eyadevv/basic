import ytdl, { videoFormat } from '@distube/ytdl-core'
import fs from 'node:fs'

// Function to download a video at 1080p quality
export default async function downloadVideo(
  url: string,
  outputPath: string,
  quality: videoFormat,
  agent: any
) {
  try {
    const videoStream = ytdl(url, { format: quality, agent })
    const fileStream = fs.createWriteStream(`${outputPath}`)

    videoStream.pipe(fileStream)

    videoStream.on('end', () => {
      console.log('Download complete!')
    })

    videoStream.on('error', (error: any) => {
      console.error('Error during download:', error.code)
    })
  } catch (error) {
    console.error('Error in download function:', error.code)
  }
}
