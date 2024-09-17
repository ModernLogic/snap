//
//  cli.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-04
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import fs from 'fs/promises'
import * as Http from 'http'

import type { CliRunOptions } from './CliRunOptions'
import { createRequestAsyncHandler } from './createRequestAsyncHandler'
import { AndroidPlatformAbstraction } from './pal/android/AndroidPlatformAbstraction'
import { IOSPlatformAbstraction } from './pal/ios/IOSPlatformAbstraction'
import { readConfig } from './readConfig'
import { sleep } from './sleep'

export interface TestResults {
  fail: number
  success: number
  test: number
}

export const runHandler = async (args: CliRunOptions): Promise<number> => {
  try {
    return await runHandlerNoTry(args)
  } catch (e) {
    console.warn('Failed', e)
    return -1
  }
}

const runHandlerNoTry = async (args: CliRunOptions): Promise<number> => {
  console.log('runHandler', args.platform)
  const config = await readConfig(args.config)
  const platform = args.platform
  const pal =
    args.platform === 'ios' ? new IOSPlatformAbstraction(args, config) : new AndroidPlatformAbstraction(args, config)

  const update = args.update
  const snapshots = '.snap/snapshots'
  const latestSnapshots = `.snap/snapshots/latest/${platform}`

  const testResults: TestResults = {
    fail: 0,
    success: 0,
    test: 0
  }

  const handleRequestAsync = createRequestAsyncHandler(latestSnapshots, pal, snapshots, update, testResults)
  const handleRequest = (content: string, res: Http.ServerResponse, done: () => void): void => {
    handleRequestAsync(content, res, done).catch((e) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Error handling request')
    })
  }
  await fs.rm(`${snapshots}/latest`, { recursive: true, force: true })
  await fs.rm(`${snapshots}/diff`, { recursive: true, force: true })
  try {
    await fs.mkdir(latestSnapshots, { recursive: true })
  } catch {
    // no op
  }
  await pal.terminate()

  // delay to ensure simctl terminate has finished quitting
  await sleep(300)

  return await new Promise<number>((resolve) => {
    let connected = false
    let timeRemaining = 30
    const done = (): void => {
      console.log(JSON.stringify(testResults))
      srv.close()
      if (testResults.fail === 0 && testResults.test > 0) {
        resolve(0)
      }
      resolve(1)
    }
    const i = setInterval(() => {
      timeRemaining = timeRemaining - 1
      if (timeRemaining === 0) {
        clearInterval(i)

        if (!connected) {
          console.warn('Simulator has not connected after 30 seconds')
          done()
        }
      }
    }, 1000)
    const srv = Http.createServer(function (req, res) {
      let content = ''
      req.on('data', (chunk: string) => (content = content + chunk))
      req.on('end', () => {
        handleRequest(content, res, done)
      })
      connected = true
    })
    srv.on('clientError', (err, socket) => {
      console.warn('Bad request', err)
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
      connected = true
      done()
    })
    srv.listen(0, function () {
      const address = srv.address()
      if (typeof address === 'string' || address === null) {
        console.log('Listening on address: ', address)
      } else {
        // xcrun(['simctl', 'launch', config.ios.simulator, config.ios.bundleIdentifier, ...additionalArgs], {
        //   SIMCTL_CHILD_storybookPage: limit === undefined ? 'turbo' : `turbo:${limit}`,
        //   SIMCTL_CHILD_snapPort: `${address.port}`
        // })
        pal
          .launch(address.port)
          .then(() => {
            console.log(`Listening on port ${address.port}`)
          })
          .catch((e) => {
            console.warn('Failed to launch using simctl -- bailing')
            done()
          })
      }
    })
  })
}
