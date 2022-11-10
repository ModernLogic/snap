//
//  readConfig.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-11-09
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import fs from 'fs/promises'
import { Config } from './Config'

export async function readConfig (configPath?: string): Promise<Config> {
  if (configPath === undefined) {
    throw new Error('Cannot find .snaprc.json file')
  }
  const contents = await fs.readFile(configPath, { encoding: 'utf-8' })
  const parsed = JSON.parse(contents)
  return parsed
}
