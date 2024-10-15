import ytdl from '@distube/ytdl-core'
import fs, { rmSync } from 'node:fs'
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
      // Check if the video already exists
      if (fs.existsSync(outputPath)) {
        console.log('File already exists. Skipping download.')
        return resolve()
      }

      // Get the video format with the highest quality

      // Ensure content length is available for progress tracking
      const totalSize = Number(quality.contentLength)
      // Initialize the progress bar
      const progressBar = new cliProgress.SingleBar(
        {
          format: 'Downloading [{bar}] {percentage}% | {value}/{total} MB',
        },
        cliProgress.Presets.shades_classic
      )

      let downloadedSize = 0
      const totalSizeInMB = totalSize / (1024 * 1024) // Convert bytes to MB
      progressBar.start(totalSizeInMB, 0)

      // Start the download stream
      const videoStream = ytdl(url, { agent, format: quality })
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
        rmSync(outputPath, { force: true })
        reject(error)
      })

      fileStream.on('error', (error: any) => {
        progressBar.stop()
        console.error('Error writing file:', error)
        reject(error)
      })
    } catch (error) {
      reject(`Error in download function: ${error.message}`)
    }
  })
}
