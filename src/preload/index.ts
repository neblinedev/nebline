import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron' // Added ipcRenderer

// Create a variable to store the current project
let currentProject: { projectPath: string; journalPath: string } | null = null

// Custom APIs for renderer
const ipcApi = {
  onFolderSelected: (callback: (folderPath: string) => void): void => {
    ipcRenderer.on('folder-selected', (_event, folderPath) => callback(folderPath))
  },

  zoomIn: (): Promise<number> => ipcRenderer.invoke('zoom:increase'),
  zoomOut: (): Promise<number> => ipcRenderer.invoke('zoom:decrease'),
  zoomReset: (): Promise<number> => ipcRenderer.invoke('zoom:reset'),
  getZoomLevel: (): Promise<number> => ipcRenderer.invoke('zoom:getLevel'),
  setZoomLevel: (level: number): Promise<number> => ipcRenderer.invoke('zoom:setLevel', level),

  joinPath: (...paths: string[]): Promise<string> => ipcRenderer.invoke('fs:joinPath', ...paths),
  checkPathExists: (path: string): Promise<boolean> =>
    ipcRenderer.invoke('fs:checkPathExists', path),
  ensureDirExists: (path: string): Promise<void> => ipcRenderer.invoke('fs:ensureDirExists', path),
  ensureFileExists: (path: string, defaultContent?: string): Promise<void> =>
    ipcRenderer.invoke('fs:ensureFileExists', path, defaultContent),
  readFileContent: (path: string): Promise<string | null> =>
    ipcRenderer.invoke('fs:readFileContent', path),
  writeFileContent: (path: string, content: string): Promise<void> =>
    ipcRenderer.invoke('fs:writeFileContent', path, content),
  // Function to read directory contents
  readDir: (path: string): Promise<{ name: string; isDirectory: boolean }[] | null> =>
    ipcRenderer.invoke('fs:readDir', path),
  // Function to trigger folder selection dialog
  selectFolder: (): Promise<string | undefined> => ipcRenderer.invoke('dialog:openDirectory'),
  // Function to open path in OS file explorer
  showItemInFolder: (path: string): Promise<boolean> =>
    ipcRenderer.invoke('shell:showItemInFolder', path),
  // Function to open terminal at path
  openTerminal: (path: string): Promise<boolean> => ipcRenderer.invoke('shell:openTerminal', path),

  // NEW: Store current project data for access from the main process
  setCurrentProject: (project: { projectPath: string; journalPath: string } | null): void => {
    currentProject = project
  },

  // NEW: Method for main process to retrieve the current project
  _getCurrentProject: (): { projectPath: string; journalPath: string } | null => {
    return currentProject
  }
}

export type IpcApi = typeof ipcApi

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', ipcApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = ipcApi // Also update here for non-isolated context
}
