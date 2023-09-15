///
//  avdmanager.ts
//  Modern Logic
//
//  Created by Modern Logic on 2023-09-14
//  Copyright © 2023 Modern Logic, LLC. All Rights Reserved.

import { spawn } from 'node:child_process'

interface ForkConfig {
  logMessages?: boolean
}
type ForkFunc = (args: string[], env: Record<string, string | undefined>) => { result: Promise<string>, proc: any}

export const makeFork = (cmdlineExecutablePath: string, config: ForkConfig = {}): ForkFunc => {
  const id = cmdlineExecutablePath.split('/').pop() ?? 'UNKNOWN'
  const originalEnv = process.env

  return (args, env = {}) => {
    const stdoutMessages: string[] = []
    console.log(`${id} spawning with args: ${args.join(' ')}`)
    const proc = spawn(cmdlineExecutablePath, args, { env: { ...originalEnv, ...env } })
    const result = new Promise<string>((resolve) => {
      const logBuffer: string[] = []
      const lastStream: string = ''
      function maybeLog (streamName: string, data: any): void {
        if ((config?.logMessages ?? false)
        ) {
          if (lastStream !== streamName) {
            process.stdout.write(`${id} ${streamName}: ${logBuffer.join('')}`)
            logBuffer.length = 0
          }
          if (typeof data === 'string') {
            logBuffer.push(data)
          } else if (Buffer.isBuffer(data)) {
            logBuffer.push(data.toString('utf8'))
          } else {
            logBuffer.push(`${data as unknown as string}`)
          }
          if (logBuffer.reduce((acc, cur) => acc + cur.length, 0) > 80) {
            process.stdout.write(`${id} ${streamName}: ${logBuffer.join('')}`)
            logBuffer.length = 0
          }
        }
      }
      proc.stdout.on('data', (data) => {
        stdoutMessages.push(data)
        maybeLog('stdout', data)
      })

      proc.stderr.on('data', (data) => {
        maybeLog('stderr', data)
      })

      proc.on('close', (code) => {
        maybeLog('close', '')
        resolve(stdoutMessages.join(''))
      })
    })
    return { result, proc }
  }
}
