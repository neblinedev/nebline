import React from 'react'

const WelcomeScreen: React.FC = () => {
  const handleSelectFolder = (): void => {
    window.api.selectFolder() // Use the exposed API function
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-2xl font-semibold mb-4">Welcome to Nebline</h1>
      <p className="mb-2">Nebline is a journaling app with AI-assisted psychological insights.</p>
      <p className="mb-6">Please select a hournal folder to get started.</p>
      <button
        onClick={handleSelectFolder}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Select journal folder
      </button>
    </div>
  )
}

export default WelcomeScreen
