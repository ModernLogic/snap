//
//  ci.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-11-09
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

import { runHandler } from './cli'
import { readConfig } from './readConfig'
import { xcrun } from './xcrun'
import net from 'net'
import process from 'node:process'
import { spawn } from 'node:child_process'
import { ChildProcessWithoutNullStreams } from 'child_process'

async function findAvailablePort (): Promise<number> {
  return await new Promise((resolve, reject) => {
    const srv = net.createServer(function (sock) {
      sock.end('Hello world\n')
    })
    srv.listen(0, function () {
      const addressInfo = srv.address()
      if (typeof addressInfo === 'string' || addressInfo === null) {
        srv.close()
        reject(new Error('Did not bind to port'))
        return
      }
      const port = addressInfo?.port
      srv.close(() => {
        resolve(port)
      })
    })
  })
}

export interface CliRunOptions {
  platform: 'ios' | 'android'
  config: string
  limit?: string
  skipInstall: boolean
}

export const runCiTest = async (args: CliRunOptions): Promise<number> => {
  const config = await readConfig(args.config)
  const platform = args.platform
  const skipInstall = args.skipInstall
  if (platform !== 'ios') {
    throw new Error('Error: support for Android not implemented')
  }

  const {
    simulator: device,
    bundleIdentifier: bundleId,
    appName
  } = config.ios

  console.log('Terminating currently running process (if any)')
  try {
    await xcrun(['simctl', 'terminate', device, bundleId])
  } catch (e) {
    console.log("App wasn't running")
  }

  await sleep(3000)

  console.log(`Shutting down simulator '${device}' (if booted)`)
  try {
    await xcrun(['simctl', 'shutdown', device])
  } catch (e) {
    console.log("Device wasn't booted")
  }

  // wait for simulator to shutdown
  // fixme it'd be nice to know how long this really takes
  await sleep(3000)

  // Ensure hardware keyboard is connected -- no way to do this ?!?
  // In Xcode 12 this worked, but it doesn't any more :(
  // take JSON output from this command
  // plutil -convert json -o - ~/Library/Preferences/com.apple.iphonesimulator.plist
  // and then update that plist while the simulator is shutdown
  // plutil -replace DevicePreferences.${TARGET_DEVICE_IDENTIFIER}.ConnectHardwareKeyboard -bool NO ~/Library/Preferences/com.apple.iphonesimulator.plist

  console.log(`Booting ${device}`)
  await xcrun(['simctl', 'boot', device])

  // wait for simulator to boot
  await sleep(6000)

  // Ensure in light mode, not dark mode
  await xcrun(['simctl', 'ui', 'booted', 'appearance', 'light'])
  await xcrun(['simctl', 'status_bar', device, 'override', '--time', 'SNAP', '--dataNetwork', 'lte', '--wifiMode', 'active', '--wifiBars', '3', '--cellularBars', '4', '--cellularMode', 'active', '--batteryState', 'charged', '--batteryLevel', '75'])
  await sleep(200)

  if (!skipInstall) {
    console.log('Uninstall app...')
    try {
      await xcrun(['simctl', 'uninstall', device, bundleId])
    } catch (e) {
      console.log('Could not uninstall')
    }

    // wait for simulator to uninstall app
    await sleep(6000)

    console.log('Installing app...')
    try {
      await xcrun(['simctl', 'install', device, `ios/output/Build/Products/Debug-iphonesimulator/${appName}`])
    } catch (e) {
      console.log('Could not install the app !?')
    }

    // wait for app to install
    await sleep(3000)
  }

  const port = await findAvailablePort()

  // FIXME what if the react-native app uses npm instead of yarn?
  const yarnProc = spawn('yarn', ['start', '--port', `${port}`], { detached: true })

  yarnProc.stdout.on('data', (data) => console.log('metro: ', bufferToString(data)))
  yarnProc.stderr.on('data', (data) => console.log('METRO: ', bufferToString(data)))
  const yarnExited = new Promise<number | null>((resolve) => {
    yarnProc.on('close', (code) => {
      // console.log('metro close', code)
      resolve(code)
    })
    yarnProc.on('exit', (code) => {
      // console.log('metro exit', code)
      resolve(code)
    })
    yarnProc.on('disconnect', () => {
      console.log('METRO DISCONNECTED')
    })
    yarnProc.on('error', (code) => {
      console.log('METRO ERROR', code.message)
    })
  })
  process.on('SIGINT', () => {
    console.log('SIGINT!')
    const doIt = async (): Promise<void> => {
      await cleanupMetroProcess(yarnProc, yarnExited)
    }
    doIt().finally(() => process.exit()
    )
  })

  await sleep(15000)

  const exitCode = await runHandler({ ...args, update: false, port: `${port}` })

  console.log(`Done testing exitCode:${exitCode}. Terminating metro...`)

  await cleanupMetroProcess(yarnProc, yarnExited)

  return exitCode
}

async function sleep (milliseconds: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const bufferToString = (data: any): string => {
  if (typeof data === 'object') {
    return data.toString('utf8')
  }
  return 'NOSTR'
}

async function cleanupMetroProcess (yarnProc: ChildProcessWithoutNullStreams, yarnExited: Promise<number | null>): Promise<void> {
  killProcGroup(yarnProc)
  // console.log('...kill message sent.  Awaiting exit...')

  const code = await (yarnExited)
  if (code !== null && code !== 0) {
    console.log(`...Metro exited with code ${code ?? -1}`)
  }

  // console.log('Terminating app in simulator (if any)')
  try {
    await xcrun(['simctl', 'terminate', device, bundleId])
  } catch (e) {
    console.log("Cannot Terminating app: App wasn't running?")
  }
  await xcrun(['simctl', 'status_bar', device, 'clear'])
}

function killProcGroup (proc: ChildProcessWithoutNullStreams): void {
  if (proc.pid != null) {
    process.kill(-proc.pid)
  } else {
    proc.kill()
  }
}
