import ReactMonacoEditor, { monaco } from 'react-monaco-editor'

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
    'editor.background': '#264f78', // Dark background
    'editor.foreground': '#d4d4d4', // Default text color
    'editorCursor.foreground': '#aeafad', // Cursor color
    'editor.lineHighlightBackground': '#3c3c3c', // Line highlight color
    'editorLineNumber.foreground': '#858585', // Line number color
    'editor.selectionBackground': '#FFFF00' // Bright yellow selection for visibility
    // Add more color customizations as needed
  }
})

// Use ComponentNameProps type for the component's props
function MonacoEditor(): JSX.Element {
  return (
    <ReactMonacoEditor
      width="100%"
      height="100%"
      language="markdown" // Set language to Markdown
      theme="myCustomTheme" // Use the custom theme name
      value="// some comment"
      options={{
        selectOnLineNumbers: true,
        fontSize: 14, // Set the font size (e.g., 14px)
        automaticLayout: true,
        minimap: {
          enabled: false
        },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        wrappingIndent: 'same'
      }}
    />
  )
}

export default MonacoEditor
