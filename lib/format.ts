import ytdl, { videoFormat, videoInfo } from '@distube/ytdl-core'
import fs from 'node:fs'
import path from 'node:path'

const cacheDir = path.join(process.cwd(), 'cache') // Directory to store cached video info
const cacheFile = path.join(cacheDir, 'videoInfoCache.json') // Cache file

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir)
}

// Load cached video info from file
const loadCache = () => {
  if (fs.existsSync(cacheFile)) {
    const cacheData = fs.readFileSync(cacheFile, 'utf-8')
    return JSON.parse(cacheData)
  }
  return {}
}

// Save video info to cache
const saveCache = (cache: any) => {
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2))
}

// Get cached video info or fetch new one if not cached
async function getCachedVideoInfo(url: string, agent: any) {
  const cache = loadCache()
  if (cache[url]) {
    console.log('Using cached video info')
    return cache[url]
  }

  // Fetch video info from YouTube
  const info = await ytdl.getInfo(url, { agent })
  cache[url] = info // Cache the fetched info
  saveCache(cache) // Save cache to file
  return info
}

// Filter formats to get only those that contain video and specific quality labels
function filterVideoFormats(info: videoInfo) {
  return info.formats.filter(
    (format: videoFormat) =>
      format.hasVideo &&
      // format.hasAudio && // Ensure the format has audio
      [
        '1080p',
        '1080p60 HDR',
        '1080p60',
        '720p',
        '720p60 HDR',
        '720p60',
        '480p',
        '480p60 HDR',
      ].includes(format.qualityLabel)
  )
}

// Main function to get video info
export default async function getVideoInfo(url: string, agent: any) {
  try {
    const info = await getCachedVideoInfo(url, agent)
    const videoFormats = filterVideoFormats(info)

    if (!videoFormats.length) {
      throw new Error('No valid video formats found for this video.')
    }

    return { videoFormats, info }
  } catch (error) {
    throw new Error(error.message || 'Failed to retrieve video information.')
  }
}
