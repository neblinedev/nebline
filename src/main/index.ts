import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron' // Added Menu, dialog
import fs from 'fs/promises' // Use promises API for async operations
import { dirname, join } from 'path' // Added dirname
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,

    // autoHideMenuBar: true, // Remove this to show the menu
    ...{ icon },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true // Recommended for security
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // --- Menu Definition ---
  const menuTemplate: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: async (): Promise<void> => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory']
            })
            if (!result.canceled && result.filePaths.length > 0) {
              const folderPath = result.filePaths[0]
              console.log('Selected folder:', folderPath) // Log selection
              mainWindow.webContents.send('folder-selected', folderPath)
            }
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
        // Add other edit items if needed
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom', label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0' },
        { role: 'zoomIn', accelerator: 'CmdOrCtrl+Plus' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // Add other menus like Window, Help as needed
    {
      label: 'Developer',
      submenu: [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }]
    }
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
  // --- End Menu Definition ---

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.nebline.app')

  // Set application name
  app.name = 'Nebline'

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // --- Register IPC Handlers for File System Operations ---
  ipcMain.handle('fs:joinPath', (_event, ...paths) => {
    return join(...paths)
  })

  // --- Zoom Control Handlers ---
  ipcMain.handle('zoom:increase', (event) => {
    const webContents = event.sender
    const currentLevel = webContents.getZoomLevel()
    webContents.setZoomLevel(currentLevel + 0.5)
    return webContents.getZoomLevel()
  })

  ipcMain.handle('zoom:decrease', (event) => {
    const webContents = event.sender
    const currentLevel = webContents.getZoomLevel()
    webContents.setZoomLevel(currentLevel - 0.5)
    return webContents.getZoomLevel()
  })

  ipcMain.handle('zoom:reset', (event) => {
    const webContents = event.sender
    webContents.setZoomLevel(0)
    return 0
  })

  ipcMain.handle('zoom:getLevel', (event) => {
    return event.sender.getZoomLevel()
  })

  ipcMain.handle('zoom:setLevel', (event, level) => {
    event.sender.setZoomLevel(level)
    return event.sender.getZoomLevel()
  })
  // --- End Zoom Control Handlers ---

  ipcMain.handle('fs:checkPathExists', async (_event, path) => {
    try {
      await fs.access(path)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('fs:ensureDirExists', async (_event, path) => {
    try {
      await fs.mkdir(path, { recursive: true }) // recursive: true creates parent dirs if needed
    } catch (error: unknown) {
      // Ignore error if directory already exists, rethrow otherwise
      // Check if error is an object with a 'code' property
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code !== 'EEXIST'
      ) {
        console.error(`Failed to ensure directory exists: ${path}`, error)
        throw error // Rethrow error to be caught by renderer
      }
    }
  })

  ipcMain.handle('fs:ensureFileExists', async (_event, path, defaultContent = '') => {
    try {
      await fs.access(path) // Check if file exists
    } catch {
      // File doesn't exist, create it
      try {
        await fs.mkdir(dirname(path), { recursive: true }) // Ensure parent directory exists first
        await fs.writeFile(path, defaultContent, 'utf-8')
      } catch (writeError) {
        console.error(`Failed to create file: ${path}`, writeError)
        throw writeError // Rethrow error
      }
    }
  })

  ipcMain.handle('fs:readFileContent', async (_event, path) => {
    try {
      const content = await fs.readFile(path, 'utf-8')
      return content
    } catch (error: unknown) {
      // If file not found, return null, otherwise log and rethrow
      // Check if error is an object with a 'code' property
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'ENOENT'
      ) {
        return null
      }
      console.error(`Failed to read file: ${path}`, error)
      throw error // Rethrow other errors
    }
  })

  ipcMain.handle('fs:writeFileContent', async (_event, path, content) => {
    try {
      await fs.writeFile(path, content, 'utf-8')
    } catch (error) {
      console.error(`Failed to write file: ${path}`, error)
      throw error // Rethrow error
    }
  })

  // Handler to read directory contents
  ipcMain.handle(
    'fs:readDir',
    async (_event, dirPath: string): Promise<{ name: string; isDirectory: boolean }[] | null> => {
      try {
        const dirents = await fs.readdir(dirPath, { withFileTypes: true })
        return dirents.map((dirent) => ({
          name: dirent.name,
          isDirectory: dirent.isDirectory()
        }))
      } catch (error: unknown) {
        // If directory not found, return null, otherwise log and rethrow
        if (
          typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === 'ENOENT'
        ) {
          return null // Indicate directory not found
        }
        console.error(`Failed to read directory: ${dirPath}`, error)
        throw error // Rethrow other errors
      }
    }
  )
  // --- End File System IPC Handlers ---

  // --- Dialog Handler ---
  ipcMain.handle('dialog:openDirectory', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) {
      console.error('Could not find browser window for dialog')
      return undefined
    }

    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory']
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const folderPath = result.filePaths[0]
      console.log('Selected folder via button:', folderPath) // Log selection
      // Send to renderer for global state update (e.g., ProjectContext)
      event.sender.send('folder-selected', folderPath)
      // Return to the specific caller (WelcomeScreen's invoke)
      return folderPath
    }

    return undefined // Return undefined if cancelled
  })
  // --- End Dialog Handler ---

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
