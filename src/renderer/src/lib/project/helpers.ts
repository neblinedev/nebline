import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear' // Needed for week number
import isoWeek from 'dayjs/plugin/isoWeek' // Needed for ISO week calculations
import utc from 'dayjs/plugin/utc' // Recommended for consistency
import weekday from 'dayjs/plugin/weekday' // Needed for getting day of week
import { ProjectConfig } from './project-schema'
dayjs.extend(weekOfYear)
dayjs.extend(isoWeek)
dayjs.extend(utc)
dayjs.extend(weekday)

export type DocumentWithInsights = {
  document: string
  insights: string
}

// Define the structure of our project object
export type NeblineProject = {
  projectPath: string
  journalPath: string
  currentWeekPath: string // Renamed from currentDayPath
  currentJournalFile: string
}

// Define the structure for a specific week's data
export type JournalWeek = {
  weekPath: string
  weekFolderName: string
  journalFile: string
  journalContent: string
  insightsFile: string
  insightsContent: string
  weekStartDate: Date
  weekEndDate: Date
}

// Gets the ISO week number (1-53)
function getWeekNumber(date: Date): number {
  return dayjs(date).isoWeek()
}

// Gets the year associated with the ISO week (can differ from calendar year near year end/start)
function getWeekYear(date: Date): number {
  return dayjs(date).isoWeekYear()
}

// Formats the week identifier string
function getFormattedWeek(date: Date): string {
  const year = getWeekYear(date)
  const week = getWeekNumber(date).toString().padStart(2, '0') // Ensure 2 digits
  return `${year}-CW-${week}`
}

// Gets the start date of the ISO week (Monday)
function getWeekStartDate(date: Date): Date {
  return dayjs(date).isoWeekday(1).startOf('day').toDate()
}

// Gets the end date of the ISO week (Sunday)
function getWeekEndDate(date: Date): Date {
  return dayjs(date).isoWeekday(7).endOf('day').toDate()
}

// Generates the default markdown content for a new week's journal
function generateDefaultWeekContent(startDate: Date, formattedWeek: string): string {
  let content = `# Journal - Week ${formattedWeek}\n\n`
  const start = dayjs(startDate)
  for (let i = 0; i < 7; i++) {
    const currentDay = start.add(i, 'day')
    const formattedDay = currentDay.format('YYYY-MM-DD')
    const dayName = currentDay.format('dddd') // Full day name (e.g., Monday)
    content += `## ${formattedDay} (${dayName})\n\n`
  }
  return content
}

/**
 * Opens a project folder, ensures necessary files/folders exist,
 * and returns the project structure.
 * This function will interact with the main process via IPC for file operations.
 */
export async function openProject(folderPath: string): Promise<NeblineProject | null> {
  // Keep name, but logic changes
  console.log(`Attempting to open project at: ${folderPath}`)
  try {
    // 1. Ensure nebline.json exists
    const neblineJsonPath = await window.api.joinPath(folderPath, 'nebline.json') // Use window.api
    const neblineJsonExists = await window.api.checkPathExists(neblineJsonPath) // Use window.api
    if (!neblineJsonExists) {
      console.log(`Creating ${neblineJsonPath}`)
      // Create a basic file initially, the full config will be created by loadConfig
      await window.api.ensureFileExists(
        // Use window.api
        neblineJsonPath,
        JSON.stringify({ version: 1 }, null, 2)
      )
    } else {
      console.log(`${neblineJsonPath} already exists.`)
    }

    // 2. Ensure journal folder exists
    const journalPath = await window.api.joinPath(folderPath, 'journal') // Use window.api
    console.log(`Ensuring journal directory exists: ${journalPath}`)
    await window.api.ensureDirExists(journalPath) // Use window.api

    // 3. Ensure about.md file exists
    const aboutFilePath = await window.api.joinPath(folderPath, 'about.md')
    const aboutExists = await window.api.checkPathExists(aboutFilePath)
    if (!aboutExists) {
      console.log(`Creating empty about.md file at ${aboutFilePath}`)
      await window.api.writeFileContent(aboutFilePath, '')
    }

    // 4. Load today's journal by default (which also ensures the folder/file)
    const today = new Date()
    const weekData = await loadWeek(folderPath, today) // Changed from loadDay to loadWeek

    if (!weekData) {
      console.error("Failed to load current week's journal data during project open.")
      return null // Should not happen if ensureDir/File work
    }

    const project: NeblineProject = {
      projectPath: folderPath,
      journalPath: journalPath,
      currentWeekPath: weekData.weekPath,
      currentJournalFile: weekData.journalFile
    }

    console.log('Project opened successfully:', project)
    return project
  } catch (error) {
    console.error('Error opening project:', error)
    // Handle errors appropriately, maybe show a message to the user
    return null
  }
}

/**
 * Loads the journal data for a specific week within a project.
 * Ensures the week's folder and journal/insights files exist.
 * Reads the content of the journal and insights files.
 */
export async function loadWeek(projectPath: string, date: Date): Promise<JournalWeek | null> {
  try {
    const year = getWeekYear(date).toString() // Use week year
    const formattedWeek = getFormattedWeek(date) // YYYY-CW-WW
    const weekStartDate = getWeekStartDate(date)
    const weekEndDate = getWeekEndDate(date)

    const journalBasePath = await window.api.joinPath(projectPath, 'journal')
    const yearPath = await window.api.joinPath(journalBasePath, year) // journal/YYYY (using week year)
    const weekPath = await window.api.joinPath(yearPath, formattedWeek) // journal/YYYY/YYYY-CW-WW
    const journalFile = await window.api.joinPath(weekPath, 'journal.md') // journal/YYYY/YYYY-CW-WW/journal.md
    const insightsFile = await window.api.joinPath(weekPath, 'insights.md') // journal/YYYY/YYYY-CW-WW/insights.md

    console.log(`Loading week: ${formattedWeek}. Ensuring path: ${weekPath}`)

    // Ensure year directory exists: journal/YYYY
    await window.api.ensureDirExists(yearPath)
    // Ensure week directory exists: journal/YYYY/YYYY-CW-WW
    await window.api.ensureDirExists(weekPath)

    // Ensure journal file exists: journal/YYYY/YYYY-CW-WW/journal.md
    // Generate default content with daily headers if creating the file
    const defaultJournalContent = generateDefaultWeekContent(weekStartDate, formattedWeek)
    await window.api.ensureFileExists(journalFile, defaultJournalContent)

    // Ensure insights file exists: journal/YYYY/YYYY-CW-WW/insights.md
    await window.api.ensureFileExists(insightsFile, `# Insights - Week ${formattedWeek}\n\n`) // Default empty content for insights

    console.log(`Reading content from: ${journalFile} and ${insightsFile}`)
    const journalContent = await window.api.readFileContent(journalFile)
    const insightsContent = await window.api.readFileContent(insightsFile)

    const weekData: JournalWeek = {
      weekPath: weekPath,
      weekFolderName: formattedWeek, // Use the calculated week string
      journalFile: journalFile,
      journalContent: journalContent ?? '', // Ensure content is string
      insightsFile: insightsFile,
      insightsContent: insightsContent ?? '', // Ensure content is string
      weekStartDate: weekStartDate,
      weekEndDate: weekEndDate
    }
    console.log(`Week ${formattedWeek} loaded successfully.`)
    return weekData
  } catch (error) {
    console.error(`Error loading week containing ${dayjs(date).format('YYYY-MM-DD')}:`, error)
    return null
  }
}

/**
 * Saves content to a specific file.
 */
export async function saveFileContent(filePath: string, content: string): Promise<boolean> {
  try {
    console.log(`Saving content to file: ${filePath}`)
    await window.api.writeFileContent(filePath, content) // Use window.api
    console.log(`Content saved successfully to file: ${filePath}`)
    return true
  } catch (error) {
    console.error(`Error saving content to file ${filePath}:`, error)
    return false
  }
}

/**
 * Loads the configuration file (nebline.json) for a project.
 */
export async function loadConfig(projectPath: string): Promise<ProjectConfig> {
  try {
    console.log(`Loading configuration file from: ${projectPath}`)
    const configFilePath = await window.api.joinPath(projectPath, 'nebline.json')

    // Check if the config file exists
    const exists = await window.api.checkPathExists(configFilePath)
    if (!exists) {
      // Create default config if it doesn't exist
      console.log('Configuration file does not exist, creating default')
      const defaultConfig: ProjectConfig = {
        openRouterApiKey: '',
        openAiApiKey: '',
        anthropicApiKey: '',
        model: 'anthropic:claude-3-7-sonnet-20250219',
        googleApiKey: ''
      }
      const defaultConfigStr = JSON.stringify(defaultConfig, null, 2)
      await window.api.writeFileContent(configFilePath, defaultConfigStr)
      return defaultConfig
    }

    const content = await window.api.readFileContent(configFilePath)
    console.log('Configuration file loaded successfully')

    const defaultConfig: ProjectConfig = {
      openRouterApiKey: '',
      openAiApiKey: '',
      anthropicApiKey: '',
      model: 'anthropic:claude-3-7-sonnet-20250219',
      googleApiKey: ''
    }

    return content ? JSON.parse(content) : defaultConfig
  } catch (error) {
    console.error('Error loading configuration file:', error)
    throw error
  }
}

/**
 * Saves content to the configuration file.
 */
export async function saveConfigFile(projectPath: string, content: string): Promise<boolean> {
  try {
    console.log(`Saving configuration file to: ${projectPath}`)
    const configFilePath = await window.api.joinPath(projectPath, 'nebline.json')
    await window.api.writeFileContent(configFilePath, content)
    console.log('Configuration file saved successfully')
    return true
  } catch (error) {
    console.error('Error saving configuration file:', error)
    return false
  }
}

/**
 * Fetches journal content for multiple weeks.
 *
 * @param projectPath - The path to the project directory
 * @param currentWeekFolderName - The folder name of the current week (e.g., "2023-CW-01")
 * @param count - The number of weeks to fetch (including the current week)
 * @returns An array of DocumentWithInsights objects, sorted from newest to oldest
 */
export async function fetchJournalHistory(
  projectPath: string,
  currentWeekFolderName: string,
  count: number
): Promise<DocumentWithInsights[]> {
  try {
    console.log(`Fetching journal history: ${count} weeks`)

    // Parse the current week folder name to get year and week number
    const match = currentWeekFolderName.match(/^(\d{4})-CW-(\d{2})$/)
    if (!match) {
      console.error(`Invalid week folder name format: ${currentWeekFolderName}`)
      return []
    }

    const journalBasePath = await window.api.joinPath(projectPath, 'journal')

    // Get all available weeks
    const weeks: string[] = []
    const yearDirs = await window.api.readDir(journalBasePath)

    if (yearDirs) {
      for (const yearDir of yearDirs) {
        if (yearDir.isDirectory && /^\d{4}$/.test(yearDir.name)) {
          const yearPath = await window.api.joinPath(journalBasePath, yearDir.name)
          const weekDirs = await window.api.readDir(yearPath)

          if (weekDirs) {
            for (const weekDir of weekDirs) {
              if (weekDir.isDirectory && /^\d{4}-CW-\d{2}$/.test(weekDir.name)) {
                weeks.push(weekDir.name)
              }
            }
          }
        }
      }
    }

    // Sort weeks in descending order (newest first)
    weeks.sort((a, b) => b.localeCompare(a))

    // Always include the current week
    const filteredWeeks = weeks

    // Take the requested number of weeks
    const selectedWeeks = filteredWeeks.slice(0, count)

    // Fetch journal and insights content for each selected week
    const journalWithInsights: DocumentWithInsights[] = []

    for (const weekFolderName of selectedWeeks) {
      // Extract year from the week folder name
      const yearMatch = weekFolderName.match(/^(\d{4})-CW-\d{2}$/)
      if (!yearMatch) continue

      const year = yearMatch[1]
      const yearPath = await window.api.joinPath(journalBasePath, year)
      const weekPath = await window.api.joinPath(yearPath, weekFolderName)
      const journalFile = await window.api.joinPath(weekPath, 'journal.md')
      const insightsFile = await window.api.joinPath(weekPath, 'insights.md')

      // Check if the journal file exists
      const journalExists = await window.api.checkPathExists(journalFile)
      let journalContent = ''
      if (journalExists) {
        const content = await window.api.readFileContent(journalFile)
        if (content) {
          journalContent = content
        }
      }

      // Check if the insights file exists, create it if it doesn't
      let insightsContent = ''
      const insightsExists = await window.api.checkPathExists(insightsFile)
      if (insightsExists) {
        const content = await window.api.readFileContent(insightsFile)
        if (content) {
          insightsContent = content
        }
      } else {
        // Create an empty insights file with default content
        insightsContent = `# Insights - Week ${weekFolderName}\n\n`
        await window.api.ensureFileExists(insightsFile, insightsContent)
      }

      // Only add to the result if we have journal content
      if (journalContent) {
        journalWithInsights.push({
          document: journalContent,
          insights: insightsContent
        })
      }
    }

    console.log(`Fetched ${journalWithInsights.length} journal entries with insights for history`)
    return journalWithInsights
  } catch (error) {
    console.error('Error fetching journal history:', error)
    return []
  }
}
