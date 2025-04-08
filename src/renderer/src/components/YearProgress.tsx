import React, { useState, useEffect } from 'react'

const YearProgress: React.FC = () => {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const calculateProgress = (): void => {
      const now = new Date()
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1)
      const totalDaysInYear = (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
      const dayOfYear =
        Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const percentage = Math.round((dayOfYear / totalDaysInYear) * 100)
      setProgress(percentage)
    }

    calculateProgress()
    // Optional: Update progress periodically if needed, e.g., daily
    // const interval = setInterval(calculateProgress, 1000 * 60 * 60 * 24); // Update daily
    // return () => clearInterval(interval);
  }, [])

  return (
    <div className="flex items-center space-x-3 text-sm text-text-secondary">
      <span className="flex items-center">Year Progress</span>
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
        <div className="h-full bg-primary-base" style={{ width: `${progress}%` }} />
      </div>
      <span className="flex items-center text-text-secondary">{progress}%</span>
    </div>
  )
}

export default YearProgress
