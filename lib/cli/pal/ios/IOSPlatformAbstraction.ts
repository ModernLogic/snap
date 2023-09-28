//
//  IOSPlatformAbstraction.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-12-13
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import type { CliRunOptions } from '../../CliRunOptions'
import type { Config } from '../../Config'
import { sleep } from '../../sleep'
import type { PlatformAbstractionLayer, Rect } from '../PlatformAbstractionLayer'
import { xcrun } from './xcrun'

export class IOSPlatformAbstraction implements PlatformAbstractionLayer {
  private readonly device: string
  private readonly bundleId: string
  private readonly appName: string
  constructor (private readonly cliArgs: CliRunOptions, private readonly config: Config) {
    this.device = config.ios.simulator
    this.bundleId = config.ios.bundleIdentifier
    this.appName = config.ios.appName
  }

  public readonly name = 'ios'

  async launch (snapPort: number): Promise<void> {
    const RCT_METRO_PORT = process.env.RCT_METRO_PORT ?? this.cliArgs.port
    const additionalArgs: string[] =
      RCT_METRO_PORT !== undefined ? ['-RCT_jsLocation', `localhost:${RCT_METRO_PORT}`] : []
    const storybookPage = this.cliArgs.limit
    await xcrun(['simctl', 'launch', this.device, this.bundleId, ...additionalArgs], {
      SIMCTL_CHILD_storybookPage: storybookPage === undefined ? 'turbo' : `turbo:${storybookPage}`,
      SIMCTL_CHILD_snapPort: `${snapPort}`
    })
  }

  async terminate (): Promise<void> {
    await xcrun(['simctl', 'terminate', this.device, this.bundleId])
  }

  async takeSnapshot (filename: string): Promise<void> {
    await xcrun(['simctl', 'io', this.device, 'screenshot', filename])
  }

  async maskedRects (width: number, height: number): Promise<Rect[]> {
    if (this.device === 'iPhone 13') {
      const iPhone13 = { width: 1170, height: 2532 }
      const homeButton = { top: 2492, left: 374, width: 424, height: 20 }

      if (width === iPhone13.width && height === iPhone13.height) {
        return [homeButton]
      }
    }
    return []
  }

  async shutdown (): Promise<void> {
    await xcrun(['simctl', 'shutdown', this.device])
  }

  async boot (): Promise<void> {
    await xcrun(['simctl', 'boot', this.device])

    // wait for simulator to boot
    await sleep(6000)

    // Ensure in light mode, not dark mode
    await xcrun(['simctl', 'ui', 'booted', 'appearance', 'light'])

    // Set up the status bar to be in a consistent state
    await xcrun([
      'simctl',
      'status_bar',
      this.device,
      'override',
      '--time',
      'SNAP',
      '--dataNetwork',
      'lte',
      '--wifiMode',
      'active',
      '--wifiBars',
      '3',
      '--cellularBars',
      '4',
      '--cellularMode',
      'active',
      '--batteryState',
      'charged',
      '--batteryLevel',
      '75'
    ])

    // wait for status bar to update
    await sleep(200)
  }

  async uninstall (): Promise<void> {
    try {
      await xcrun(['simctl', 'uninstall', this.device, this.bundleId])

      // wait for simulator to uninstall app
      await sleep(6000)
    } catch (e) {
      console.log('Could not uninstall')
    }
  }

  async install (): Promise<void> {
    try {
      await xcrun(['simctl', 'install', this.device, `ios/output/Build/Products/Debug-iphonesimulator/${this.appName}`])
    } catch (e) {
      console.log('Could not install the app !?')
    }

    // wait for app to install
    await sleep(3000)
  }

  async cleanup (): Promise<void> {
    // console.log('Terminating app in simulator (if any)')
    try {
      await xcrun(['simctl', 'terminate', this.device, this.bundleId])
    } catch (e) {
      console.log("Cannot Terminating app: App wasn't running?")
    }
    await xcrun(['simctl', 'status_bar', this.device, 'clear'])
  }
}
