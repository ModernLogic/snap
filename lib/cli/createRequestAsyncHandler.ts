//
//  createRequestAsyncHandler.ts
//  Modern Logic
//
//  Created by Modern Logic on 2023-09-15
//  Copyright © 2023 Modern Logic, LLC. All Rights Reserved.

import fs from 'fs/promises'
import type * as Http from 'http'

import type { TCommand } from '../types/TCommands'
import type { TestResults } from './cli'
import { diffImages } from './diffImages'
import { xcrun } from './pal/ios/xcrun'
import type { PlatformAbstractionLayer } from './pal/PlatformAbstractionLayer'

export function createRequestAsyncHandler (
  latestSnapshots: string,
  pal: PlatformAbstractionLayer,
  snapshots: string,
  update: boolean,
  testResults: TestResults
) {
  return async (content: string, res: Http.ServerResponse, done: () => void): Promise<void> => {
    try {
      const json: TCommand = JSON.parse(content)
      switch (json.command) {
        case 'quit':
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              response: 'goodbye'
            })
          )
          done()
          break
        case 'echo':
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              response: 'echo',
              echo: json.Test
            })
          )
          break
        case 'snapshot': {
          const filename = `${latestSnapshots}/${json.screenName}.png`

          await pal.takeSnapshot(filename)

          const result = await diffImages(pal, snapshots, filename, update)
          if (result.pass) {
            await fs.unlink(filename)
            // In case a diff was saved from earlier try but after waiting a few
            // more ms it passes.
            try {
              await fs.unlink(result.diffPath)
            } catch (e) {
              // Dont care
            }
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              response: 'screenshot',
              success: result.pass,
              diffPixelsCount: result.diffPixelsCount
            })
          )

          break
        }
        case 'testResult':
          testResults.test = testResults.test + 1
          if (json.pass) {
            testResults.success = testResults.success + 1
          } else {
            testResults.fail = testResults.fail + 1
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              response: 'testResult',
              testResults
            })
          )
          break
        case 'xcrun':
          xcrun(json.args ?? [], json.env ?? {})
            .then((result) => {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(
                JSON.stringify({
                  response: 'xcrun',
                  code: result
                })
              )
            })
            .catch((e) => {
              let message = 'Unknown error'
              if (e instanceof Error) {
                message = e.message
              }
              console.warn('Error w/ xcrun: ', message)
              res.writeHead(500, { 'Content-Type': 'text/plain' })
              res.end('Error handling request: ' + message)
            })
          break
        default:
          console.warn('Unknown command: ', (json as any).command)
          res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.end('Error handling request')
          break
      }
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Error handling request')
    }
  }
}
