import ytdl from '@distube/ytdl-core'
import fs, { rmSync } from 'node:fs'

// Function to delay for a specified number of seconds (used for retries)
function delay(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

// Recursive download function with retries and event-based progress
async function downloadVideo(
  url: string,
  outputPath: string,
  quality: any,
  agent: any,
  sendEvent: (msg: string) => void, // Send event to client
  retries = 3 // Retry count
): Promise<void> {
  console.log('Invoke Download Function')
  return new Promise((resolve, reject) => {
    // Check if file already exists
    if (fs.existsSync(outputPath)) {
      sendEvent('File already exists. Skipping download.')
      return resolve()
    }

    // Start the download process
    try {
      const totalSize = Number(quality.contentLength)
      let downloadedSize = 0

      // Convert total size to MB for easier client-side handling
      const totalSizeInMB = totalSize / (1024 * 1024)

      // Stream video download
      const videoStream = ytdl(url, { agent, format: quality })
      const fileStream = fs.createWriteStream(outputPath)

      // Listen for data to send progress events
      videoStream.on('data', (chunk) => {
        console.log(chunk)
        downloadedSize += chunk.length
        const progress = (downloadedSize / (1024 * 1024) / totalSizeInMB) * 100
      })

      // Handle finish event when download completes
      fileStream.on('finish', () => {
        sendEvent('Download complete!')
        resolve()
      })

      // Handle errors in download stream
      videoStream.on('error', async (error) => {
        console.log(error)
        sendEvent('Error during download' + error.message)
        rmSync(outputPath, { force: true }) // Clean up partial download
        if (retries > 0) {
          sendEvent(`Retrying... Attempts left: ${retries}`)
          await delay(2) // Wait before retrying
          await downloadVideo(url, outputPath, quality, agent, sendEvent, retries - 1)
        } else {
          reject(new Error('Max retry attempts reached. Download failed.'))
        }
      })

      // Handle file stream errors
      fileStream.on('error', async () => {
        sendEvent('Error writing file')
        rmSync(outputPath, { force: true }) // Clean up partial file
        if (retries > 0) {
          sendEvent(`Retrying... Attempts left: ${retries}`)
          await delay(2)
          await downloadVideo(url, outputPath, quality, agent, sendEvent, retries - 1)
        } else {
          reject(new Error('Max retry attempts reached. File write failed.'))
        }
      })

      // Pipe the video stream to the file system
      videoStream.pipe(fileStream)
    } catch (error) {
      sendEvent('Unexpected error occurred')
      reject(error)
    }
  })
}

export default downloadVideo
