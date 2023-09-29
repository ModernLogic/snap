export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

export interface PlatformAbstractionLayer {
  name: 'ios' | 'android'
  launch: (snapPort: number) => Promise<void>
  terminate: () => Promise<void>
  takeSnapshot: (filename: string) => Promise<void>
  maskedRects: (width: number, height: number) => Promise<Rect[]>

  // for CI/CD
  shutdown: () => Promise<void>
  boot: () => Promise<void>
  uninstall: () => Promise<void>
  install: () => Promise<void>
  cleanup: () => Promise<void>
}
