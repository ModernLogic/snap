//
//  readConfig.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-11-09
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import fs from 'fs/promises'

import type { Config } from './Config'

export async function readConfig (configPath?: string): Promise<Config> {
  if (configPath === undefined) {
    throw new Error('Cannot find .snaprc.json file')
  }
  const contents = await fs.readFile(configPath, { encoding: 'utf-8' })
  const parsed = JSON.parse(contents)
  if (parsed.ios === undefined) {
    throw new Error('Missing ios configuration')
  }
  if (parsed.android === undefined || parsed.android.package === undefined || parsed.android.activity === undefined) {
    throw new Error('Missing android package / activity configuration')
  }
  return parsed
}
