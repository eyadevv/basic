import ytdl from '@distube/ytdl-core'
export default async function getVideoInfo(url: string, agent: any) {
  const videoInfo = await ytdl.getInfo(url, { agent })
  const bestQualityFormat = videoInfo.formats.filter(
    (format) => format.hasVideo && format.qualityLabel
  ) // Ensure it's a video format

  const format = bestQualityFormat.filter(
    (value) =>
      (value.qualityLabel === '1080p' ||
        value.qualityLabel === '1080p60' ||
        value.qualityLabel === '1080p60 HDR' ||
        value.qualityLabel === '720p' ||
        value.qualityLabel === '720p60' ||
        value.qualityLabel === '720p60 HDR') &&
      value.hasAudio
  )
  return { format, videoInfo }
}
