import Sidebar from './components/Sidebar'
import Main from './components/Main'
import MonacoEditor from '@renderer/components/MonacoEditor'

function App(): JSX.Element {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <Main>
        Hello
        <MonacoEditor />
      </Main>
    </div>
  )
}

export default App
