import { JournalWeek } from '@renderer/lib/project/helpers'
import classNames from 'classnames'
import dayjs from 'dayjs'
import 'font-awesome/css/font-awesome.min.css'

interface SidebarProps {
  availableWeeks: string[]
  loadWeek: (date: Date) => Promise<void>
  currentWeekData: JournalWeek | null
  isWeekLoading: boolean
  view: 'journal' | 'configuration'
  toggleView: () => void
}

function Sidebar({
  availableWeeks,
  loadWeek,
  currentWeekData,
  isWeekLoading,
  view,
  toggleView
}: SidebarProps): JSX.Element {
  const handleWeekClick = (weekString: string): void => {
    // Don't allow loading another week if we're already loading one
    if (isWeekLoading) return

    const parts = weekString.match(/^(\d{4})-CW-(\d{2})$/)
    if (parts) {
      const year = parseInt(parts[1], 10)
      const week = parseInt(parts[2], 10)
      const dateToLoad = dayjs().year(year).isoWeek(week).isoWeekday(1).toDate()

      console.log(`Sidebar: Loading week ${weekString} (using date ${dateToLoad.toISOString()})`)
      if (view === 'configuration') {
        toggleView()
      }
      loadWeek(dateToLoad) // Use loadWeek
    } else {
      console.error(`Sidebar: Failed to parse week string: ${weekString}`)
    }
  }

  const currentWeekString = currentWeekData?.weekFolderName ?? null

  return (
    <div className="w-64 h-screen px-3 overflow-y-auto space-y-2">
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
