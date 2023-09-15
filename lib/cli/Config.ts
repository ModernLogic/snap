//
//  Config.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-11-09
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

export interface Config {
  ios: {
    bundleIdentifier: string
    simulator: string
    appName: string
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
  }
}
