//
//  xcrun.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-04
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import { spawn } from 'node:child_process'
export async function xcrun (args: string[], env: Record<string, string> = {}): Promise<any> {
  return await new Promise((resolve) => {
    // console.log(`xcrun ${args.join(' ')} ${JSON.stringify(env ?? {})}`)
    const proc = spawn('xcrun', args, { env })

    proc.stdout.on('data', (data) => {
      // console.log(`stdout: ${data}`);
    })

    proc.stderr.on('data', (data) => {
      // console.error(`stderr: ${data}`);
    })

    proc.on('close', (code) => {
      resolve(code)
    })
  })
}
