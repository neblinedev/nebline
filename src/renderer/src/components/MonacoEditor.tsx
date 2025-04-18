import { useRef, useEffect } from 'react'
import ReactMonacoEditor, { monaco, EditorDidMount } from 'react-monaco-editor'
import * as monacoEditor from 'monaco-editor/esm/vs/editor/editor.api'

// import 'monaco-editor/esm/vs/language/json/monaco.contribution' // Import JSON language featres
// import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution' // Import Markdown language features
// import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js'

// --- Other Imports ---
import { debounce } from 'lodash-es'

// Define a custom theme
monaco.editor.defineTheme('myCustomTheme', {
  base: 'vs-dark', // can be 'vs', 'vs-dark', 'hc-black'
  inherit: true, // inherit default rules
  rules: [
    { token: 'comment', foreground: 'ffa500', fontStyle: 'italic underline' }, // orange comments
    { token: 'keyword', foreground: '00ff00' }, // green keywords
    { token: 'string', foreground: 'ff00ff' } // magenta strings
    // Add more rules as needed
  ],
  colors: {
    // 'editor.background': '#264f78', // Dark background
    // 'editor.foreground': '#d4d4d4', // Default text color
    // 'editorCursor.foreground': '#aeafad', // Cursor color
    // 'editor.lineHighlightBackground': '#3c3c3c', // Line highlight color
    // 'editorLineNumber.foreground': '#858585', // Line number color
    // 'editor.selectionBackground': '#FFFF00' // Bright yellow selection for visibility
    // Add more color customizations as needed
  }
})

// Define props interface
interface MonacoEditorProps {
  value: string
  onChange: (newValue: string) => void
  language?: 'markdown' | 'json' // Add language prop with default to markdown
}

// Use ComponentNameProps type for the component's props
function MonacoEditor({ value, onChange, language = 'markdown' }: MonacoEditorProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null)

  // Handler for when the editor mounts
  const handleEditorDidMount: EditorDidMount = (editor) => {
    // Store editor reference
    editorRef.current = editor
    console.log('Monaco Editor Mounted.')
    // Schema configuration moved to useEffect
  }
  // Handler for editor content changes
  const handleEditorChange = (newValue: string): void => {
    onChange(newValue) // Call the passed-in onChange handler
  }

  // Effect to handle resizing with debouncing
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Debounce the layout call
    const debouncedLayout = debounce(() => {
      editorRef.current?.layout()
    }, 100) // Debounce time in ms (e.g., 100ms)

    const resizeObserver = new ResizeObserver(() => {
      debouncedLayout() // Call the debounced function
    })

    resizeObserver.observe(container)

    // Cleanup function
    return (): void => {
      debouncedLayout.cancel() // Cancel any pending debounced calls
      resizeObserver.disconnect()
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <ReactMonacoEditor
        width="100%" // These might not be strictly necessary anymore with the container div
        height="100%" // but leaving them doesn't hurt
        language={language} // Use language prop to set the editor language
        theme="myCustomTheme" // Use the custom theme name
        value={value} // Use the value prop
        onChange={handleEditorChange} // Use the onChange prop
        editorDidMount={handleEditorDidMount} // Get editor instance
        options={{
          selectOnLineNumbers: true,
          fontSize: 14, // Set the font size (e.g., 14px)
          // automaticLayout: true, // We are handling layout manually now
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          wrappingIndent: 'same',
          minimap: {
            enabled: false
          }
          // No need to explicitly enable find widget here, the import handles it
        }}
      />
    </div>
  )
}

export default MonacoEditor
