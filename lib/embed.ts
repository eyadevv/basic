import { PlaywrightLauncher } from 'crawlee'

function delay(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000))
}

export default async function embed(
  pathToVideo: string,
  output: string,
  coverPath: string
): Promise<string | null> {
  const browser = await new PlaywrightLauncher({
    useChrome: true,
    launchOptions: {
      viewport: null,
      headless: false, // To see the process
      timeout: 30000,
      acceptDownloads: true,
      downloadsPath: `${output}`, // Set downloadsPath to save the file
    },
  }).launch()

  const page = await browser.newPage()

  await delay(2)

  try {
    await page.goto('https://georgeom.net/StegOnline/upload')
    await page.waitForLoadState('networkidle') // Ensure that the network is idle

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(coverPath)
    await page.waitForURL('https://georgeom.net/StegOnline/image')
    await page.waitForLoadState('networkidle')

    const embedButton = page.getByRole('button', { name: 'Embed Files/Data' })
    await embedButton.waitFor({ state: 'visible', timeout: 9999999 })
    await embedButton.click()
    await page.waitForURL('https://georgeom.net/StegOnline/embed')

    const redCell = page.getByRole('cell', { name: 'R' })
    const greenCell = page.getByRole('cell', { name: 'G' })
    const blueCell = page.getByRole('cell', { name: 'B' })

    await redCell.waitFor({ state: 'visible' })
    await greenCell.waitFor({ state: 'visible' })
    await blueCell.waitFor({ state: 'visible' })

    await redCell.click()
    await greenCell.click()
    await blueCell.click()

    const combobox = page
      .locator('app-embed-menu div')
      .filter({ hasText: 'Back to HomeInput Data: Type' })
      .getByRole('combobox')

    await combobox.waitFor({ state: 'visible' })
    await combobox.selectOption('File')

    const videoInput = page.locator('input[type="file"]')
    await videoInput.setInputFiles(pathToVideo)
    await delay(2)

    const goButton = page.getByRole('button', { name: 'Go' })
    await goButton.waitFor({ state: 'visible', timeout: 9999999 })
    await goButton.click()

    const downloadButton = page.getByRole('button', { name: 'Download Extracted Data' })
    await downloadButton.waitFor({ state: 'visible', timeout: 9999999 })

    const downloadPromise = page.waitForEvent('download')
    await downloadButton.click()
    const file = await downloadPromise
    const downloadPath = `${pathToVideo}.png`
    await file.saveAs(downloadPath)

    await browser.close()

    // Return the path to the downloaded file
    return downloadPath
  } catch (error) {
    await browser.close()
    throw new Error(error)
  }
}
