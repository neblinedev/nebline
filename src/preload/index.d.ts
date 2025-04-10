import { ElectronAPI } from '@electron-toolkit/preload'

// Define the interface for our custom API
export interface IpcApi {
  onFolderSelected: (callback: (folderPath: string) => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: IpcApi // Use the defined interface
  }
}
