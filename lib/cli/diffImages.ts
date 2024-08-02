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

import type { PlatformAbstractionLayer } from './pal/PlatformAbstractionLayer'

export interface TImageInfo {
  filePath: string
  dirPath: string
}

export function imagePath (
  screenshotsDir: string,
  platform: 'ios' | 'android',
  mode: 'diff' | 'reference' | 'latest',
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
  diffPath: string
}
export const diffImages = async (
  pal: PlatformAbstractionLayer,
  screenshotsDir: string,
  latestFilePath: string,
  update: boolean = false
): Promise<TDiffResults> => {
  const filename = path.basename(latestFilePath)
  const { filePath: diffPath, dirPath: diffDir } = imagePath(screenshotsDir, pal.name, 'diff', filename)

  try {
    const { filePath: baselinePath, dirPath: baselineDir } = imagePath(screenshotsDir, pal.name, 'reference', filename)
    await fs.mkdir(baselineDir, { recursive: true })

    await fs.mkdir(diffDir, { recursive: true })

    const baselineData = await fs.readFile(baselinePath)
    const baselineImage = PNG.sync.read(baselineData)

    const latestData = await fs.readFile(latestFilePath)
    const latestImage = PNG.sync.read(latestData)

    const diffImage = new PNG({
      width: baselineImage.width,
      height: baselineImage.height
    })

    const maskedRects = await pal.maskedRects(baselineImage.width, baselineImage.height)

    const baselineImageData = baselineImage.data
    const latestImageData = latestImage.data
    const { width, height } = baselineImage

    for (const maskedRect of maskedRects) {
      if (width === latestImage.width && height === latestImage.height) {
        // mask off the area from both baseline and latest file because, e.g. on
        // iOS the home button appearance changes gradually in response to stuff
        // going on
        ;[baselineImageData, latestImageData].forEach((img) => {
          for (let dx = 0; dx < maskedRect.width; dx++) {
            for (let dy = 0; dy < maskedRect.height; dy++) {
              const x = maskedRect.left + dx
              const y = maskedRect.top + dy
              if (x < width && y < height) {
                const offset = x * 4 + y * 4 * width
                img.writeUInt32BE(0xff0000ff, offset)
              }
            }
          }
        })
      }
    }

    const diffPixelsCount = pixelmatch(baselineImageData, latestImageData, diffImage.data, width, height)

    if (diffPixelsCount === 0) {
      return {
        message: 'Compared screenshot to match baseline. No differences were found.',
        pass: true,
        diffPixelsCount,
        diffPath
      }
    }

    if (update) {
      await fs.writeFile(baselinePath, PNG.sync.write(latestImage))
      console.log('Updated reference')
      return {
        message: 'Updated baseline',
        pass: true,
        diffPixelsCount: 0,
        diffPath
      }
    }

    // Create and save the diff image
    await fs.writeFile(diffPath, PNG.sync.write(diffImage))
    await fs.writeFile(latestFilePath, PNG.sync.write(latestImage))

    // FIXME -- add support for a certain number of differing pixels

    return {
      message: `Compared screenshot to match baseline. ${diffPixelsCount} were different.`,
      pass: diffPixelsCount === 0,
      diffPixelsCount,
      diffPath
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
      diffPixelsCount: -1,
      diffPath
    }
  }
}
