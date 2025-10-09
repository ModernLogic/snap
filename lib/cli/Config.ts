//
//  Config.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-11-09
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import { type Permission } from '../types'

export interface Config {
  packageManager?: 'npm' | 'yarn' | 'pnpm'
  revokePermissions?: Permission[]
  ios: {
    bundleIdentifier: string
    simulator: string
    appName: string
    blackoutRegions?: Array<{
      top: number
      left: number
      width: number
      height: number
    }>
  }
  android: {
    package: string
    activity: string
    buildToolsVersion: string
    keystore: string // path to keystore file
    keyAlias: string
    device: {
      name?: string
      sdkId?: string // e.g. system-images;android-25;google_apis;x86_64
      deviceDefinition?: string // e.g. pixel_xl
    }
    blackoutRegions?: Array<{
      top: number
      left: number
      width: number
      height: number
    }>
  }
}
