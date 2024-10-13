import { exec } from 'node:child_process'

export default async function split(VideoPath: string) {
  return exec(
    `/home/eyad/Projects/basic/lib/split.sh ${VideoPath} 15000000 "-c:v libx264 -crf 23 -c:a copy -vf scale=960:-1"`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      console.log(`stdout: ${stdout}`)
      console.error(`stderr: ${stderr}`)
    }
  )
}
