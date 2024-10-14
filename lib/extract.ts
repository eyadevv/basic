import { PlaywrightLauncher } from 'crawlee'
function delay(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

export default async function launch() {
  console.log('launcher')
  // Launch the browser with proper configurations
  const browser = await new PlaywrightLauncher({
    useChrome: true,
    launchOptions: {
      viewport: null,
      headless: true, // To see the process
      timeout: 99999999,
      acceptDownloads: true,
      downloadsPath: '/home/eyad/Downloads', // Disable the timeout for long operations
    },
  }).launch()
  console.log('done ')
  const page = await browser.newPage()

  // Wait for the page to fully load
  await page.goto('https://georgeom.net/StegOnline/upload')
  await page.waitForLoadState('networkidle') // Ensure that the network is idle
  // Set the file directly to avoid the native file picker
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles('/home/eyad/Downloads/output.png') // Set file without clicking the button
  await page.waitForURL('https://georgeom.net/StegOnline/image')
  await page.waitForLoadState('networkidle')
  const embedButton = page.getByRole('button', { name: 'Extract Files/Data' })
  await embedButton.waitFor({ state: 'visible', timeout: 9999999 }) // Ensure visibility

  await embedButton.click()
  await page.waitForURL('https://georgeom.net/StegOnline/extract')
  await page.waitForLoadState('networkidle')
  const redCell = page.getByRole('cell', { name: 'R' })
  const greenCell = page.getByRole('cell', { name: 'G' })
  const blueCell = page.getByRole('cell', { name: 'B' })

  await redCell.waitFor({ state: 'visible' })
  await greenCell.waitFor({ state: 'visible' })
  await blueCell.waitFor({ state: 'visible' })

  await redCell.click()
  await greenCell.click()
  await blueCell.click()

  await delay(2)
  const goButton = page.getByRole('button', { name: 'Go' })
  await goButton.waitFor({ state: 'visible', timeout: 9999999 })
  await goButton.click()
  const downloadButton = page.getByRole('button', { name: 'Download Extracted Data' })
  await downloadButton.waitFor({ state: 'visible', timeout: 9999999 }) // Wait for the "Download Extracted Data" button to appear

  const downloadPromise = page.waitForEvent('download')
  await downloadButton.click()
  const download = await downloadPromise
  download.saveAs('file.mp4')
  console.log('Download started: ')
}

await launch()
