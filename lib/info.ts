import ytdl from '@distube/ytdl-core'
export default async function getVideoInfo(url: string, agent: any) {
  const videoInfo = await ytdl.getInfo(url, { agent })
  const bestQualityFormat = videoInfo.formats.filter(
    (format) => format.hasVideo && format.qualityLabel
  ) // Ensure it's a video format

  const format = bestQualityFormat.filter(
    (value) => value.qualityLabel === '360p' || value.qualityLabel === '360p60 HDR'
  )
  return { format, videoInfo }
}
