export interface CliRunOptions {
  platform: 'ios' | 'android'
  config: string
  update: boolean
  limit?: string
  port?: string
  skipInstall?: boolean
}
