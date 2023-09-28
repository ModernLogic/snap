//
//  sdkmanager.ts
//  Modern Logic
//
//  Created by Modern Logic on 2023-09-14
//  Copyright © 2023 Modern Logic, LLC. All Rights Reserved.

import { makeFork } from '../../fork'

export function sdkmanager (args: string[], env: Record<string, string> = {}): { result: Promise<string>, proc: any } {
  const ANDROID_SDK_ROOT = process.env.ANDROID_SDK_ROOT
  if (ANDROID_SDK_ROOT === undefined) {
    throw new Error('ANDROID_SDK_ROOT is not set')
  }
  return makeFork(`${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager`, { logMessages: true })(args, env)
}
