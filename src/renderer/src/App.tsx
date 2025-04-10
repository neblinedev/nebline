import { useState, useEffect } from 'react' // Import hooks
import Sidebar from './components/Sidebar'
import Main from './components/Main'
import MonacoEditor from '@renderer/components/MonacoEditor'

function App(): JSX.Element {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null) // Add state for folder path

  useEffect(() => {
    // Listen for the folder selected event from the main process via preload
    window.api.onFolderSelected((folderPath) => {
      console.log('Folder selected in renderer:', folderPath) // Log in renderer console
      setSelectedFolder(folderPath) // Update state
    })

    // Optional: Cleanup function if needed, though ipcRenderer.on might not require explicit removal in simple cases
    // return () => {
    //   // If you need to remove the listener, expose an 'off' function in preload
    // }
  }, []) // Empty dependency array ensures this runs only once on mount
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <Main>
        {/* Display the selected folder path */}
        {selectedFolder ? (
          <p>Selected Folder: {selectedFolder}</p>
        ) : (
          <p>No folder selected. Use File &gt; Open Folder...</p>
        )}
        <MonacoEditor />
      </Main>
    </div>
  )
}

export default App
