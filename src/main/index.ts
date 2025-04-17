import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, ipcMain, Menu, net, shell } from 'electron' // Added Menu, dialog, net
import fs from 'fs/promises' // Use promises API for async operations
import { dirname, join } from 'path' // Added dirname
import { exec, spawn } from 'child_process' // Import child_process methods
import icon from '../../resources/icon.png?asset'

app.name = 'Nebline'

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
      label: 'Journal',
      submenu: [
        {
          label: 'Reveal in Finder / Explorer',
          click: async (): Promise<void> => {
            // Get the current project from renderer
            const currentProject = await mainWindow.webContents.executeJavaScript(
              `window.api._getCurrentProject && window.api._getCurrentProject()`
            )

            if (currentProject?.journalPath) {
              shell.showItemInFolder(currentProject.journalPath)
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                message: 'No journal folder is currently open.',
                buttons: ['OK']
              })
            }
          }
        },
        {
          label: 'Open in Terminal',
          click: async (): Promise<void> => {
            // Get the current project from renderer
            const currentProject = await mainWindow.webContents.executeJavaScript(
              `window.api._getCurrentProject && window.api._getCurrentProject()`
            )

            if (currentProject?.projectPath) {
              // Use existing handler for opening terminal
              if (process.platform === 'darwin') {
                // Using Terminal.app on macOS
                const terminalCommand = `open -a Terminal "${currentProject.projectPath}"`
                exec(terminalCommand, (error) => {
                  if (error) {
                    console.error('Failed to open Terminal:', error)
                  }
                })
              } else if (process.platform === 'win32') {
                // For Windows
                spawn('cmd.exe', ['/K', `cd /d "${currentProject.projectPath}"`], {
                  detached: true,
                  stdio: 'ignore'
                })
              } else {
                // For Linux
                spawn('xterm', ['-e', `cd "${currentProject.projectPath}" && bash`], {
                  detached: true,
                  stdio: 'ignore'
                })
              }
            } else {
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                message: 'No journal folder is currently open.',
                buttons: ['OK']
              })
            }
          }
        }
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
      window.webContents.send('folder-selected', folderPath)
    }
    return result
  })

  // --- Open Folder in OS Explorer Handler ---
  ipcMain.handle('shell:showItemInFolder', async (_event, folderPath: string) => {
    try {
      await shell.showItemInFolder(folderPath)
      return true
    } catch (error) {
      console.error('Failed to open folder in OS explorer:', error)
      return false
    }
  })

  // --- Open Terminal at Path Handler ---
  ipcMain.handle('shell:openTerminal', async (_event, folderPath: string) => {
    try {
      // For macOS, we can use the 'open' command with Terminal app
      if (process.platform === 'darwin') {
        // Using Terminal.app on macOS
        const terminalCommand = `open -a Terminal "${folderPath}"`
        exec(terminalCommand, (error) => {
          if (error) {
            console.error('Failed to open Terminal:', error)
            return false
          }
          console.log('Terminal opened successfully at path:', folderPath)
          return true
        })
        return true
      } else if (process.platform === 'win32') {
        // For Windows, we would use 'cmd.exe /K cd /d <path>'
        spawn('cmd.exe', ['/K', `cd /d "${folderPath}"`], { detached: true, stdio: 'ignore' })
        return true
      } else {
        // For Linux, we might use xterm or gnome-terminal
        spawn('xterm', ['-e', `cd "${folderPath}" && bash`], { detached: true, stdio: 'ignore' })
        return true
      }
    } catch (error) {
      console.error('Failed to open terminal at path:', error)
      return false
    }
  })
  // --- Show Dialog Handler ---
  ipcMain.handle('dialog:showMessageBox', async (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) {
      console.error('Could not find browser window for dialog')
      return { response: 0 }
    }

    return await dialog.showMessageBox(window, options)
  })

  // --- AI API Proxy Handler ---
  ipcMain.handle('ai:proxyRequest', async (_event, options) => {
    try {
      const { url, method, headers, body } = options

      console.log(`Making proxy request to: ${url}`)

      const request = net.request({
        method: method || 'POST',
        url
      })

      // Add headers
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          request.setHeader(key, value as string)
        })
      }

      return new Promise((resolve, reject) => {
        let responseData = ''

        request.on('response', (response) => {
          response.on('data', (chunk) => {
            responseData += chunk.toString()
          })

          response.on('end', () => {
            try {
              // Try to parse JSON response
              const parsedData = JSON.parse(responseData)
              resolve({
                status: response.statusCode,
                headers: response.headers,
                data: parsedData
              })
            } catch (_e) {
              // If not JSON, return as string
              resolve({
                status: response.statusCode,
                headers: response.headers,
                data: responseData
              })
            }
          })

          response.on('error', (error) => {
            console.error('Error in proxy response:', error)
            reject(error)
          })
        })

        request.on('error', (error) => {
          console.error('Error in proxy request:', error)
          reject(error)
        })

        // Write request body if provided
        if (body) {
          // If body is already a string, use it directly, otherwise stringify it
          const bodyData = typeof body === 'string' ? body : JSON.stringify(body)
          request.write(bodyData)
        }

        request.end()
      })
    } catch (error) {
      console.error('Error in AI proxy handler:', error)
      throw error
    }
  })
  // --- End IPC Handlers ---

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}) // End app.whenReady().then()

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
