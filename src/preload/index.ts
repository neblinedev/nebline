import { contextBridge, ipcRenderer } from 'electron' // Added ipcRenderer
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Add a method to listen for the folder selection event
  onFolderSelected: (callback: (folderPath: string) => void): void => {
    ipcRenderer.on('folder-selected', (_event, folderPath) => callback(folderPath))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api // Also update here for non-isolated context
}
