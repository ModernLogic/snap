//
//  TCommands.ts
//  Modern Logic
//
//  Created by Modern Logic on 2022-09-06
//  Copyright © 2022 Modern Logic, LLC. All Rights Reserved.

interface QuitCommand {
  command: 'quit'
}
interface EchoCommand {
  command: 'echo'
  Test: string
}
interface SnapshotCommand {
  command: 'snapshot'
  screenName: string
}
interface TestResultCommand {
  command: 'testResult'
  pass: boolean
}
interface XCRunCommand {
  command: 'xcrun'
  args?: string[]
  env?: Record<string, string>
}

export type TCommand = QuitCommand | EchoCommand | SnapshotCommand | TestResultCommand | XCRunCommand
