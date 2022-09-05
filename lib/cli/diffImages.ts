//
//  diffImages.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-04
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import fs from 'fs/promises'
import path from 'path'

import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

export interface TImageInfo {
  filePath: string
  dirPath: string
}

export function imagePath (
  screenshotsDir: string,
  platform: 'ios' | 'android',
  mode: 'diff' | 'reference' | 'latest' | 'andy' | 'andy2',
  filename: string
): TImageInfo {
  const dirPath = path.join(screenshotsDir, mode, platform)
  const filePath = path.join(dirPath, filename)
  return { filePath, dirPath }
}

export interface TDiffResults {
  message: string
  pass: boolean
  diffPixelsCount: number
}
export const diffImages = async (screenshotsDir: string, latestFilePath: string, update: boolean = false): Promise<TDiffResults> => {
  const platform = 'ios' as const

  try {
    const filename = path.basename(latestFilePath)
    const { filePath: baselinePath, dirPath: baselineDir } = imagePath(screenshotsDir, platform, 'reference', filename)
    await fs.mkdir(baselineDir, { recursive: true })

    if (update) {
      await fs.copyFile(latestFilePath, baselinePath)
      console.log('Updated reference')
      return {
        message: 'Updated baseline',
        pass: true,
        diffPixelsCount: 0
      }
    }

    const { filePath: diffPath, dirPath: diffDir } = imagePath(screenshotsDir, platform, 'diff', filename)
    await fs.mkdir(diffDir, { recursive: true })

    const baselineData = await fs.readFile(baselinePath)
    const baselineImage = PNG.sync.read(baselineData)

    const latestData = await fs.readFile(latestFilePath)
    const latestImage = PNG.sync.read(latestData)

    const diffImage = new PNG({
      width: baselineImage.width,
      height: baselineImage.height
    })

    const iPhone13 = { width: 1170, height: 2532 }
    const homeButton = { top: 2492, left: 374, width: 424, height: 20 }

    const baselineImageData = baselineImage.data
    const latestImageData = latestImage.data
    const { width, height } = baselineImage

    if (baselineImage.width === iPhone13.width && baselineImage.height === iPhone13.height && latestImage.width === iPhone13.width && latestImage.height === iPhone13.height) {
      // mask off the home button from both baseline and latest file
      // on iOS the home button appearance changes gradually in response
      // to stuff going on
      [baselineImageData, latestImageData].forEach((img) => {
        for (let x = 0; x < homeButton.width; x++) {
          for (let y = 0; y < homeButton.height; y++) {
            const offset = (homeButton.left + x) * 4 + (homeButton.top + y) * 4 * width
            img.writeUInt32BE(0xff0000ff, offset)
          }
        }
      })
    }

    const diffPixelsCount = pixelmatch(
      baselineImageData,
      latestImageData,
      diffImage.data,
      width,
      height
    )

    if (diffPixelsCount === 0) {
      return {
        message: 'Compared screenshot to match baseline. No differences were found.',
        pass: true,
        diffPixelsCount
      }
    }

    // Create and save the diff image
    await fs.writeFile(diffPath, PNG.sync.write(diffImage))
    await fs.writeFile(latestFilePath, PNG.sync.write(latestImage))

    return {
      message: `Compared screenshot to match baseline. ${diffPixelsCount} were different.`,
      pass: diffPixelsCount === 0,
      diffPixelsCount
    }
  } catch (error) {
    let message = 'Unknown error'
    if (error instanceof Error) {
      message = error.message
    }
    console.log('catch (error', message)

    return {
      message: `Screenshot diffing error - ${message}`,
      pass: false,
      diffPixelsCount: -1
    }
  }
}
