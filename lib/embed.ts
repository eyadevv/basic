import { PlaywrightLauncher } from 'crawlee'
function delay(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

export default async function embed(pathToVideo: string, coverPath: string) {
  const arr = pathToVideo.split('/')
  const filename = arr[arr.length - 1]
  const dir = `${filename.slice(0, filename.lastIndexOf('.'))}`
  arr.pop()
  arr.push(dir)
  const output = arr.join('/') // Launch the browser with proper configurations
  const browser = await new PlaywrightLauncher({
    useChrome: true,
    launchOptions: {
      viewport: null,
      headless: false, // To see the process
      timeout: 30000,
      acceptDownloads: true,
      downloadsPath: `${output}`, // Disable the timeout for long operations
    },
  }).launch()
  const page = await browser.newPage()
  // Wait for the page to fully load
  await page.goto('https://georgeom.net/StegOnline/upload')
  await page.waitForLoadState('networkidle') // Ensure that the network is idle

  // Set the file directly to avoid the native file picker
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(coverPath) // Set file without clicking the button
  await page.waitForURL('https://georgeom.net/StegOnline/image')
  await page.waitForLoadState('networkidle')

  // // Begin the embedding process
  const embedButton = page.getByRole('button', { name: 'Embed Files/Data' })
  await embedButton.waitFor({ state: 'visible', timeout: 9999999 }) // Ensure visibility
  await embedButton.click()
  await page.waitForURL('https://georgeom.net/StegOnline/embed')
  // Click R, G, B options
  const redCell = page.getByRole('cell', { name: 'R' })
  const greenCell = page.getByRole('cell', { name: 'G' })
  const blueCell = page.getByRole('cell', { name: 'B' })

  await redCell.waitFor({ state: 'visible' })
  await greenCell.waitFor({ state: 'visible' })
  await blueCell.waitFor({ state: 'visible' })

  await redCell.click()
  await greenCell.click()
  await blueCell.click()

  // Select 'File' option from the dropdown
  const combobox = page
    .locator('app-embed-menu div')
    .filter({ hasText: 'Back to HomeInput Data: Type' })
    .getByRole('combobox')

  await combobox.waitFor({ state: 'visible' }) // Ensure combobox is visible
  await combobox.selectOption('File')

  // // Upload the video file for embedding without triggering the native picker
  const videoInput = page.locator('input[type="file"]')
  await videoInput.setInputFiles(pathToVideo)
  await delay(2)
  // Start the embedding process
  const goButton = page.getByRole('button', { name: 'Go' })
  await goButton.waitFor({ state: 'visible', timeout: 9999999 })
  await goButton.click()

  // Wait for embedding to complete (adjust the wait as needed)
  const downloadButton = page.getByRole('button', { name: 'Download Extracted Data' })
  await downloadButton.waitFor({ state: 'visible', timeout: 9999999 }) // Wait for the "Download Extracted Data" button to appear

  const downloadPromise = page.waitForEvent('download')
  await downloadButton.click()
  const download = await downloadPromise
  await download.saveAs(filename)
  const path = download.path()
  await browser.close()
  return path
}
