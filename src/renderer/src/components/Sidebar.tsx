import { useProject } from '@renderer/hooks/useProject' // Import the hook
import classNames from 'classnames' // Import classnames for managing CSS classes
import dayjs from 'dayjs' // Import dayjs for date parsing
import 'font-awesome/css/font-awesome.min.css' // Make sure Font Awesome is imported

function Sidebar(): JSX.Element {
  const { availableWeeks, loadWeek, currentWeekData, isWeekLoading, view, toggleView } =
    useProject() // Updated context values

  const handleWeekClick = (weekString: string): void => {
    // Don't allow loading another week if we're already loading one
    if (isWeekLoading) return

    // Extract year and week number from YYYY-CW-WW string
    const parts = weekString.match(/^(\d{4})-CW-(\d{2})$/)
    if (parts) {
      const year = parseInt(parts[1], 10)
      const week = parseInt(parts[2], 10)
      // Get a date within that ISO week (e.g., the Monday)
      const dateToLoad = dayjs().year(year).isoWeek(week).isoWeekday(1).toDate()

      console.log(`Sidebar: Loading week ${weekString} (using date ${dateToLoad.toISOString()})`)
      // If we're in configuration view, switch to journal view
      if (view === 'configuration') {
        toggleView()
      }
      loadWeek(dateToLoad) // Use loadWeek
    } else {
      console.error(`Sidebar: Failed to parse week string: ${weekString}`)
    }
  }

  // Extract the date part (YYYY-MM-DD) from the currentDayData path for comparison
  // Extract the week part (YYYY-CW-WW) from the currentWeekData path for comparison
  // Use the weekFolderName directly for comparison
  const currentWeekString = currentWeekData?.weekFolderName ?? null

  return (
    <div className="w-64 h-screen px-4 overflow-y-auto space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Nebline</h2>
        <button
          onClick={toggleView}
          className={classNames(
            'text-xl p-2 rounded transition-colors duration-150 ease-in-out hover:bg-primary-hover',
            {
              'hover:bg-primary-hover': view !== 'configuration',
              'bg-primary-base': view === 'configuration'
            }
          )}
          title="Toggle Configuration Mode"
        >
          <i className="fa fa-cog"></i>
        </button>
      </div>
      <nav>
        {/* Use optional chaining and check length */}
        {availableWeeks && availableWeeks.length > 0 ? (
          <ul className="space-y-2">
            {availableWeeks.map((week) => {
              const isActive = week === currentWeekString // Compare with currentWeekString

              console.log(`Sidebar: Rendering week ${week} (active: ${isActive})`)

              // Calculate date range for display
              let dateRange = ''
              const parts = week.match(/^(\d{4})-CW-(\d{2})$/)
              if (parts) {
                const year = parseInt(parts[1], 10)
                const weekNum = parseInt(parts[2], 10)
                const startDate = dayjs()
                  .year(year)
                  .isoWeek(weekNum)
                  .isoWeekday(1)
                  .format('YYYY-MM-DD')
                const endDate = dayjs()
                  .year(year)
                  .isoWeek(weekNum)
                  .isoWeekday(7)
                  .format('YYYY-MM-DD')
                dateRange = `${startDate} to ${endDate}`
              }

              return (
                <li key={week}>
                  <button
                    onClick={() => handleWeekClick(week)} // Use handleWeekClick
                    disabled={isWeekLoading} // Disable buttons when loading
                    className={classNames(
                      'w-full text-left block px-3 py-2 rounded transition-colors duration-150 ease-in-out',
                      {
                        'bg-primary-base hover:bg-primary-hover': isActive, // Background for active
                        'bg-surface-1 hover:bg-gray-200 hover:text-gray-800':
                          !isActive && !isWeekLoading,
                        'opacity-50 cursor-not-allowed': isWeekLoading // Use isWeekLoading
                      }
                    )}
                  >
                    {/* Container for week and date range */}
                    <div className={classNames({ 'font-medium': isActive })}>
                      {week} {/* Display week string */}
                      {isWeekLoading && isActive && ' (Loading...)'}
                    </div>
                    {dateRange && (
                      <div
                        className={classNames('text-xs', {
                          'text-blue-200': isActive, // Lighter text for active state
                          'text-gray-500': !isActive // Standard muted color otherwise
                        })}
                      >
                        {dateRange}
                      </div>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No journal weeks found.</p>
        )}
      </nav>
    </div>
  )
}

export default Sidebar
