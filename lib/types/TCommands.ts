
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
  env?: {}
}

export type TCommand =
    | QuitCommand
    | EchoCommand
    | SnapshotCommand
    | TestResultCommand
    | XCRunCommand
