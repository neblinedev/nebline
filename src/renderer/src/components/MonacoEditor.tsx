import { Editor } from '@monaco-editor/react'

// Use ComponentNameProps type for the component's props
function MonacoEditor(): JSX.Element {
  return <Editor height="90vh" defaultLanguage="javascript" defaultValue="// some comment" />
}

export default MonacoEditor
