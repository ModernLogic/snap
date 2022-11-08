//
//  cli.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-04
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import fs from 'fs/promises'
import * as Http from 'http'
import { exit } from 'process'
import { TCommand } from '../types/TCommands'

import { diffImages } from './diffImages'
import { xcrun } from './xcrun'

export interface CliRunOptions {
  platform: 'ios' | 'android'
  config: string
  update: boolean
  limit?: string
}

export interface Config {
  ios: {
    bundleIdentifier: string
    simulator: string
  }
}

async function readConfig (configPath?: string): Promise<Config> {
  if (configPath === undefined) {
    throw new Error('Cannot find .snaprc.json file')
  }
  const contents = await fs.readFile(configPath, { encoding: 'utf-8' })
  const parsed = JSON.parse(contents)
  return parsed
}

export const runHandler = async (args: CliRunOptions): Promise<void> => {
  const configPath = '.snaprc.json'
  const config = await readConfig(configPath)
  const limit = args.limit

  const update = args.update
  const snapshots = '.snap/snapshots'
  const latestSnapshots = '.snap/snapshots/latest/ios'

  const testResults = {
    fail: 0,
    success: 0,
    test: 0
  }

  const handleRequestAsync = async (content: string, res: Http.ServerResponse, done: () => void): Promise<void> => {
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

          await xcrun(['simctl', 'io', config.ios.simulator, 'screenshot', filename])

          const result = await diffImages(snapshots, filename, update)
          if (result.pass) {
            await fs.unlink(filename)
            // In case a diff was saved from earlier try but after waiting a few
            // more ms it passes.
            try {
              await fs.unlink(result.diffPath)
            } catch (e) {
              // Dont care
            }
          } else {
            // this is purported to make the on-screen home button look normal but does not seem to work
            // await xcrun(['simctl', 'ui', config.ios.simulator, 'appearance', 'dark'])
            // await new Promise((resolve) => setTimeout(resolve, 500));
            // await xcrun(['simctl', 'ui', config.ios.simulator, 'appearance', 'light'])
            // await new Promise((resolve) => setTimeout(resolve, 500));
          }
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              response: 'screenshot',
              success: result.pass,
              diffPixelsCount: result.diffPixelsCount
            })
          )

          break }
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
  const handleRequest = (content: string, res: Http.ServerResponse, done: () => void): void => {
    handleRequestAsync(content, res, done).catch((e) => {
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('Error handling request')
    })
  }
  await fs.rm(`${snapshots}/latest`, { recursive: true, force: true })
  await fs.rm(`${snapshots}/diff`, { recursive: true, force: true })
  fs.mkdir(latestSnapshots, { recursive: true })
    .catch(() => 0)
    .then(async () => {
      await xcrun(['simctl', 'terminate', config.ios.simulator, config.ios.bundleIdentifier], {
        SIMCTL_CHILD_storybookPage: limit === undefined ? 'turbo' : `turbo:${limit}`
      })
    }
    )
    .then(
      async () =>
        await new Promise((resolve) =>
          setTimeout(() => {
            // delay to ensure simctl terminate has finished quitting
            resolve(1)
          }, 300)
        )
    )
    .then(async () => {
      return await new Promise((resolve) => {
        let connected = false
        const done = (): void => {
          resolve('Done')
          console.log(JSON.stringify(testResults))
          srv.close()
          if (testResults.fail === 0) {
            exit(0)
          }
          exit(1)
        }
        setTimeout(() => {
          if (!connected) {
            console.warn('Simulator has not connected after 30 seconds')
            done()
          }
        }, 30000)
        const srv = Http.createServer(function (req, res) {
          let content = ''
          req.on('data', (chunk: string) => (content = content + chunk))
          req.on('end', () => handleRequest(content, res, done))
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
            const RCT_METRO_PORT = process.env.RCT_METRO_PORT
            const additionalArgs: string[] = RCT_METRO_PORT !== undefined ? ['-RCT_jsLocation', `localhost:${RCT_METRO_PORT}`] : []
            xcrun(['simctl', 'launch', config.ios.simulator, config.ios.bundleIdentifier, ...additionalArgs], {
              SIMCTL_CHILD_storybookPage: limit === undefined ? 'turbo' : `turbo:${limit}`,
              SIMCTL_CHILD_snapPort: `${address.port}`
            }).then(() => {
              console.log(`Listening on port ${address.port}`)
            }).catch(e => {
              console.warn('Failed to launch using simctl -- bailing')
              done()
            })
          }
        })
      })
    })
    .catch((reason) => console.warn('FAILED', reason))
}
