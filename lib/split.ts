import { exec } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { promisify } from 'node:util'

// Promisify exec to use with async/await
const execPromise = promisify(exec)

export default async function clipper(VideoPath: string) {
  console.log('Started Splitting')
  const arr = VideoPath.split('/')
  const filename = arr[arr.length - 1]
  const dir = `${filename.slice(0, filename.lastIndexOf('.'))}`
  arr.pop()
  arr.push(dir)
  const output = arr.join('/')

  // Create the output directory if it doesn't exist
  await mkdir(output, {
    recursive: true,
  })

  // Command to split the video using the shell script
  const command = `"${import.meta.dirname}/split.sh" "${VideoPath}" "${output}" 15000000 "-c:a copy"`

  try {
    // Wait for the exec command to complete using a Promise
    const { stderr } = await execPromise(command)

    // Output any success or error messages
    // console.log(`stdout: ${stdout}`)
    if (stderr) {
      console.error(`stderr: ${stderr}`)
    }

    return 'done'
  } catch (error) {
    console.error(`exec error: ${error}`)
    throw new Error(`Failed to split video: ${error.message}`)
  }
}
