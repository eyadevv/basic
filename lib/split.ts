// #!/usr/bin/env node

import { exec } from 'node:child_process'
export default async function clipper(VideoPath: string) {
  const arr = VideoPath.split('/')
  const filename = arr[arr.length - 1]
  const dir = `${filename.slice(0, filename.lastIndexOf('.'))}`
  arr.pop()
  arr.push(dir)
  const output = arr.join('/')
  exec(
    `"${import.meta.dirname}/split.sh" "${VideoPath}" "${output}" 15000000 "-c:v libx264 -crf 23 -c:a copy -vf scale=960:-1"`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        return
      }
      console.log(`stdout: ${stdout}`)
      console.error(`stderr: ${stderr}`)
    }
  )
  return 123
}
