//
//  apksigner.ts
//  Modern Logic
//
//  Created by Modern Logic on 2023-09-15
//  Copyright © 2023 Modern Logic, LLC. All Rights Reserved.

import { Config } from '../../Config'
import { makeFork } from '../../fork'

export function makeApksigner (config: Config) {
  return (args: string[], env: Record<string, string> = {}): {result: Promise<string>, proc: any} => {
    const ANDROID_SDK_ROOT = process.env.ANDROID_SDK_ROOT
    if (ANDROID_SDK_ROOT === undefined) {
      throw new Error('ANDROID_SDK_ROOT is not set')
    }
    const buildToolsVersion = config.android.buildToolsVersion
    const envWPasswords = {
      ...process.env,
      ...env
    }

    return makeFork(`${ANDROID_SDK_ROOT}/build-tools/${buildToolsVersion}/apksigner`, {
      logMessages: true
    })(args, envWPasswords)
  }
}
