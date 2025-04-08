import { useEffect, useState } from 'react'

// Use ComponentNameProps type for the component's props
const ZoomControls = () => {
  // State for tracking zoom level
  const [zoomLevel, setZoomLevel] = useState<number>(0)

  // Handle zoom reset
  const handleZoomReset = async () => {
    await window.api.zoomReset()
    setZoomLevel(0)
  }

  // Get initial zoom level when component mounts
  useEffect(() => {
    const getInitialZoomLevel = async () => {
      const level = await window.api.getZoomLevel()
      setZoomLevel(level)
    }

    getInitialZoomLevel()
  }, [])

  // Handle zoom in
  const handleZoomIn = async () => {
    const newLevel = await window.api.zoomIn()
    setZoomLevel(newLevel)
  }

  // Handle zoom out
  const handleZoomOut = async () => {
    const newLevel = await window.api.zoomOut()
    setZoomLevel(newLevel)
  }

  return (
    <div className="flex items-center space-x-1 mr-2 border border-gray-600 rounded px-1">
      <button
        onClick={handleZoomOut}
        className="text-gray-200 px-1 py-0.5 hover:bg-gray-700 rounded"
        title="Zoom Out (Ctrl+-)"
      >
        -
      </button>
      <button
        onClick={handleZoomReset}
        className="text-xs text-gray-300 px-1 py-0.5 hover:bg-gray-700 rounded"
        title="Reset Zoom (Ctrl+0)"
      >
        {Math.round(zoomLevel * 100)}%
      </button>
      <button
        onClick={handleZoomIn}
        className="text-gray-200 px-1 py-0.5 hover:bg-gray-700 rounded"
        title="Zoom In (Ctrl++)"
      >
        +
      </button>
    </div>
  )
}

export default ZoomControls
