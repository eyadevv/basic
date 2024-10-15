import ytdl from '@distube/ytdl-core'

// Fetch video information from YouTube using the provided URL and agent
async function fetchVideoInfo(url: string, agent: any) {
  const videoInfo = await ytdl.getInfo(url, { agent })
  return videoInfo
}
// Filter formats to get only those that contain video
function filterVideoFormats(videoInfo: any) {
  const videoFormats = videoInfo.formats.filter(
    (format: any) =>
      (format.hasVideo && format.qualityLabel === '1080p') ||
      format.qualityLabel === '1080p60 HDR' ||
      format.qualityLabel === '1080p60' ||
      format.qualityLabel === '720p' ||
      format.qualityLabel === '720p60 HDR' ||
      format.qualityLabel === '720p60'
  )
  return videoFormats
} // Filter video formats to select specific quality labels

// Main function that combines all isolated parts
export default async function getVideoInfo(url: string, agent: any) {
  // Fetch video info
  try {
    const videoInfo = await fetchVideoInfo(url, agent)

    // Filter video formats
    const videoFormats = filterVideoFormats(videoInfo)

    // Select best quality formats

    // Check if the selected format has audio

    return { videoFormats, videoInfo }
  } catch (error) {
    throw new Error(error)
  }
}
