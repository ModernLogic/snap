//
//  AndroidPlatformAbstraction.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-12-13
//  Copyright © 2022 Modern Logic,LLC. All Rights Reserved.

import { adb } from './adb'
import { avdmanager } from './avdmanager'
import { CliRunOptions } from '../../CliRunOptions'
import { Config } from '../../Config'

import { sdkmanager } from './sdkmanager'
import { PlatformAbstractionLayer,Rect } from '../PlatformAbstractionLayer'
import { AndroidDeviceSdk } from './AndroidDeviceSdk'
import { sleep } from '../../sleep'
import { AvdDevice } from './AvdDevice'
import { emulator } from './emulator'
import { makeApksigner } from './apksigner'
import { makeZipalign } from './zipalign'

export class AndroidPlatformAbstraction implements PlatformAbstractionLayer {
  private n: number
  private emulatorProc: any
  private readonly apksigner: (args: string[],env?: Record<string,string>) => {
    result: Promise<string>
    proc: any
  }
  private readonly zipalign: (args: string[],env?: Record<string,string>) => {
    result: Promise<string>
    proc: any
  }

  constructor (private readonly cliArgs: CliRunOptions,private readonly config: Config) {
    this.n = 0
    this.apksigner = makeApksigner(config)
    this.zipalign = makeZipalign(config)
  }

  public get name (): 'ios' | 'android' {
    return 'android'
  }

  async createDevice (): Promise<void> {
    console.log('Snapshot device not found ... creating')
    const sdkId = this.config.android.device.sdkId ?? 'system-images;android-25;google_apis;arm64-v8a'
    const name = this.config.android.device.name ?? 'Snapshot_device'

    const sdks = await sdkmanager(['--list']).result

    const sdkList: AndroidDeviceSdk[] = sdks.split('\n').map((d: string) => {
      const values = d.trim().split('|').map((r) => r.trim())
      if (values.length !== 4 || values[0] === 'Path') {
        return undefined
      }
      const entries = [['Path',values[0]],['Version',values[1]],['Description',values[2]],['Location',values[3]]]
      return Object.fromEntries(entries) as AndroidDeviceSdk
    }).filter((d: AndroidDeviceSdk | undefined): d is AndroidDeviceSdk => d !== undefined)
    const sdk = sdkList.find((s) => s.Path === sdkId)
    if (sdk === undefined) {
      console.log('Installing sdk: ',sdkId)

      await sdkmanager(['--install',sdkId]).result
      console.log('Installed SDK')
    }
    await avdmanager(['-s','create','avd','-n',name,'-k',sdkId,'-d',this.config.android.device.deviceDefinition ?? 'pixel_xl','-f']).result
  }

  async launch (snapPort: number): Promise<void> {
    console.log('Launch')
    const storybookPage = this.cliArgs.limit

    await adb([
      'reverse',
      `tcp:${snapPort}`,
      `tcp:${snapPort}`
    ])

    // await adb([
    //   'install',
    //   'android/app/build/outputs/apk/debug/app-debug.apk'
    // ])

    await adb([
      'shell',
      'am',
      'start',
      '-a',
      'io.modernlogic.snap',
      '--es',
      'snapPort',
        `${snapPort}`,
        '--es',
        'storybookPage',
        storybookPage === undefined ? 'turbo' : `turbo:${storybookPage}`,
        '-n',
        `${this.config.android.package}/${this.config.android.activity}`
    ])
    console.log('Launched!')
  }

  async terminate (): Promise<void> {
    await adb(['shell','am','force-stop',this.config.android.package])
  }

  async takeSnapshot (filename: string): Promise<void> {
    // on Android images fade in so we must wait for that to finish
    await sleep(300)

    const shotNumber = this.n
    this.n = shotNumber + 1
    const tmpFile = `/sdcard/screenshot_${shotNumber}.png`
    await adb(['shell','screencap','-p',tmpFile])
    await adb(['pull',tmpFile,filename])
    await adb(['shell','rm',tmpFile])
  }

  async maskedRects (width: number,height: number): Promise<Rect[]> {
    if (this.config.android.device.name === 'MoLo_SNAP_Pixel_XL_API_32') {
      const pixelXL = { width: 1440,height: 2560 }
      const clockReadout = { top: 20,left: 20,width: 121,height: 45 }
      const batteryReadout = { top: 15,left: 1186,width: 166,height: 55 }

      if (width === pixelXL.width && height === pixelXL.height) {
        return [clockReadout,batteryReadout]
      }
    }
    return []
  }

  async shutdown (): Promise<void> {
    await adb(['emu','kill'])
    this.emulatorProc?.kill()
    this.emulatorProc = undefined

    // the emulator itself takes a while to shutdown after the command completes
    await sleep(300)
  }

  async boot (tryToCreate = true): Promise<void> {
    const devices = await avdmanager(['list','avd']).result
    const deviceList: AvdDevice[] = devices.split('---------').map((d: string) => {
      const entries = d.trim().split('\n').map((r) => r.trim().split(':').map((s) => s.trim()))
      return Object.fromEntries(entries) as AvdDevice
    })
    const snapDevice = deviceList.filter((d) => d.Name === this.config.android.device.name ?? 'Snapshot_device')

    if (snapDevice === undefined || snapDevice.length === 0) {
      if (tryToCreate) {
        await this.createDevice()
        return await this.boot(false)
      } else {
        throw new Error("Couldn't find snapshot device")
      }
    }
    this.emulatorProc = emulator(['-avd',snapDevice[0].Name]).proc

    await adb(['wait-for-device'])
  }

  async uninstall (): Promise<void> {
    await adb(['uninstall',this.config.android.package])
  }

  async install (): Promise<void> {

    await this.zipalign([
      '-v',
      '-p',
      '4',
      'android/app/build/outputs/apk/release/app-release-unsigned.apk',
      'android/app/build/outputs/apk/release/app-release-unsigned-aligned.apk'
    ]).result

    await this.apksigner([
      'sign',
      '--ks',
      this.config.android.keystore,
      '--ks-key-alias',
      this.config.android.keyAlias,
      '--ks-pass',
      'env:ANDROID_RELEASE_KEYSTORE_PASSWORD',
      '--key-pass',
      'env:ANDROID_RELEASE_KEY_PASSWORD',
      '--out',
      'android/app/build/outputs/apk/release/app-release-signed.apk',
      'android/app/build/outputs/apk/release/app-release-unsigned-aligned.apk'
    ]).result

    await adb(['install','-f','android/app/build/outputs/apk/release/app-release-signed.apk'])
  }

  async cleanup (): Promise<void> {
    await this.terminate()
  }
}
