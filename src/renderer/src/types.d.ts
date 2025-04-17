import { IpcApi } from '../../preload'

declare global {
  interface Window {
    api: IpcApi
    electron: {
      ipcRenderer: {
        on: (channel: string, func: (...args: any[]) => void) => void
        once: (channel: string, func: (...args: any[]) => void) => void
        send: (channel: string, ...args: any[]) => void
        invoke: (channel: string, ...args: any[]) => Promise<any>
        removeAllListeners: (channel: string) => void
      }
    }
  }
}

export {}
