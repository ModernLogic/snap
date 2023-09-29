//
//  xcrun.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-04
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import { spawn } from 'node:child_process'
export async function adb (args: string[], env: Record<string, string> = {}): Promise<any> {
  return await new Promise((resolve) => {
    const proc = spawn('adb', args)

    proc.stdout.on('data', (data) => {
      process.stdout.write(data)
    })

    proc.stderr.on('data', (data) => {
      process.stderr.write(data)
    })

    proc.on('close', (code) => {
      resolve(code)
    })
  })
}
