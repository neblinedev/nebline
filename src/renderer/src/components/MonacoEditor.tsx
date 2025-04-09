import ReactMonacoEditor from 'react-monaco-editor'

// Use ComponentNameProps type for the component's props
function MonacoEditor(): JSX.Element {
  return (
    <ReactMonacoEditor
      width="100%"
      height="600"
      language="javascript"
      theme="vs-dark"
      value="// some comment"
      options={{
        selectOnLineNumbers: true,
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
