import ytdl from '@distube/ytdl-core'
import fs from 'node:fs'
import cliProgress from 'cli-progress'

// Function to download a video at the specified quality and return a Promise
export default async function downloadVideo(
  url: string,
  outputPath: string,
  quality: any,
  agent: any
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Get the video info to track the content size for the progress bar
      ytdl
        .getInfo(url, { agent })
        .then((info) => {
          const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' })
          const totalSize = Number.parseInt(videoFormat.contentLength || '0', 10)

          // Initialize the progress bar
          const progressBar = new cliProgress.SingleBar(
            {
              format: 'Downloading [{bar}] {percentage}% | {value}/{total} MB',
            },
            cliProgress.Presets.shades_classic
          )

          let downloadedSize = 0
          progressBar.start(totalSize / (1024 * 1024), 0) // Convert bytes to MB for the progress bar

          const videoStream = ytdl(url, { agent })
          const fileStream = fs.createWriteStream(outputPath)

          // Listen for progress events to update the progress bar
          videoStream.on('data', (chunk) => {
            downloadedSize += chunk.length
            progressBar.update(downloadedSize / (1024 * 1024)) // Update progress bar with chunk size in MB
          })

          // Pipe the video stream to the file system
          videoStream.pipe(fileStream)

          // Resolve the Promise when the download is complete
          fileStream.on('finish', () => {
            progressBar.stop()
            console.log('Download complete!')
            resolve()
          })

          // Handle stream errors
          videoStream.on('error', (error: any) => {
            progressBar.stop()
            console.error('Error during download:', error)
            reject(error)
          })

          fileStream.on('error', (error: any) => {
            progressBar.stop()
            console.error('Error writing file:', error)
            reject(error)
          })
        })
        .catch((error) => {
          reject(`Error fetching video info: ${error.message}`)
        })
    } catch (error) {
      reject(`Error in download function: ${error.message}`)
    }
  })
}
