function Sidebar(): JSX.Element {
  return (
    <div className="w-64 h-screen bg-surface-0 p-4">
      <h2 className="text-xl font-semibold mb-4">Sidebar</h2>
      <nav>
        <ul className="space-y-2">
          <li>
            <a href="#" className="block px-2 py-1 rounded hover:bg-gray-200">
              Home
            </a>
          </li>
          <li>
            <a href="#" className="block px-2 py-1 rounded hover:bg-gray-200">
              Dashboard
            </a>
          </li>
          <li>
            <a href="#" className="block px-2 py-1 rounded hover:bg-gray-200">
              Projects
            </a>
          </li>
          <li>
            <a href="#" className="block px-2 py-1 rounded hover:bg-gray-200">
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}

export default Sidebar
